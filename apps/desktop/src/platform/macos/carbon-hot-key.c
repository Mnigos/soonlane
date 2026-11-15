/*
 * A system-wide hot key through the Carbon Event Manager, compiled at launch by
 * bun:ffi's `cc` (TinyCC), so it declares what it uses instead of including the
 * SDK headers. Carbon calls are not thread safe, so registering and removing run
 * on the main thread, where AppKit dispatches the presses; the handler answers
 * each press with noErr, which a JSCallback cannot return synchronously.
 */

typedef int OSStatus;
typedef unsigned int UInt32;
typedef struct { UInt32 signature; UInt32 id; } EventHotKeyID;
typedef struct { UInt32 eventClass; UInt32 eventKind; } EventTypeSpec;
typedef OSStatus (*EventHandlerProcPtr)(void *call, void *event, void *data);

extern void *dlopen(const char *path, int mode);
extern void *dlsym(void *handle, const char *symbol);
extern int pthread_main_np(void);
extern struct dispatch_queue_s _dispatch_main_q;
extern void dispatch_sync_f(void *queue, void *context, void (*work)(void *));
extern void *calloc(unsigned long count, unsigned long size);
extern void free(void *pointer);

#define RTLD_LAZY 0x1
#define NO_ERROR 0
#define EVENT_CLASS_KEYBOARD 0x6b657962 /* 'keyb' */
#define EVENT_HOT_KEY_PRESSED 5
#define HOT_KEY_SIGNATURE 0x534e4c4e /* 'SNLN' */
/* kEventHotKeyExclusive: registration fails while another app holds the key. */
#define HOT_KEY_EXCLUSIVE 1

typedef struct {
	UInt32 key_code;
	UInt32 modifiers;
	void (*on_press)(void);
	void *handler_ref;
	void *hot_key_ref;
	OSStatus status;
} HotKey;

static void *(*GetApplicationEventTarget)(void);
static OSStatus (*InstallEventHandler)(void *target, EventHandlerProcPtr handler, UInt32 count, const EventTypeSpec *types, void *data, void **ref);
static OSStatus (*RegisterEventHotKey)(UInt32 key_code, UInt32 modifiers, EventHotKeyID id, void *target, UInt32 options, void **ref);
static OSStatus (*RemoveEventHandler)(void *ref);
static OSStatus (*UnregisterEventHotKey)(void *ref);

static int load_carbon(void) {
	void *carbon;

	if (RegisterEventHotKey) return 1;
	carbon = dlopen("/System/Library/Frameworks/Carbon.framework/Carbon", RTLD_LAZY);
	if (!carbon) return 0;
	GetApplicationEventTarget = dlsym(carbon, "GetApplicationEventTarget");
	InstallEventHandler = dlsym(carbon, "InstallEventHandler");
	RemoveEventHandler = dlsym(carbon, "RemoveEventHandler");
	UnregisterEventHotKey = dlsym(carbon, "UnregisterEventHotKey");
	RegisterEventHotKey = dlsym(carbon, "RegisterEventHotKey");

	return GetApplicationEventTarget && InstallEventHandler && RemoveEventHandler && UnregisterEventHotKey && RegisterEventHotKey;
}

static void on_main_thread(void *context, void (*work)(void *)) {
	if (pthread_main_np()) work(context);
	else dispatch_sync_f(&_dispatch_main_q, context, work);
}

/* Every hot key of the app reaches every handler on its target, so the app registers one. */
static OSStatus handle_press(void *call, void *event, void *data) {
	((HotKey *)data)->on_press();

	return NO_ERROR;
}

static void install(void *context) {
	HotKey *hot_key = context;
	EventTypeSpec types[1] = {{EVENT_CLASS_KEYBOARD, EVENT_HOT_KEY_PRESSED}};
	EventHotKeyID id = {HOT_KEY_SIGNATURE, 1};
	void *target = GetApplicationEventTarget();

	hot_key->status = InstallEventHandler(target, handle_press, 1, types, hot_key, &hot_key->handler_ref);
	if (hot_key->status != NO_ERROR) return;
	hot_key->status = RegisterEventHotKey(hot_key->key_code, hot_key->modifiers, id, target, HOT_KEY_EXCLUSIVE, &hot_key->hot_key_ref);
	if (hot_key->status != NO_ERROR) RemoveEventHandler(hot_key->handler_ref);
}

static void uninstall(void *context) {
	HotKey *hot_key = context;

	UnregisterEventHotKey(hot_key->hot_key_ref);
	RemoveEventHandler(hot_key->handler_ref);
}

/* The registration to pass to unregister_hot_key, or NULL when Carbon refused it. */
void *register_hot_key(UInt32 key_code, UInt32 modifiers, void (*on_press)(void)) {
	HotKey *hot_key;

	if (!load_carbon()) return 0;
	hot_key = calloc(1, sizeof(HotKey));
	if (!hot_key) return 0;
	hot_key->key_code = key_code;
	hot_key->modifiers = modifiers;
	hot_key->on_press = on_press;
	on_main_thread(hot_key, install);
	if (hot_key->status == NO_ERROR) return hot_key;
	free(hot_key);

	return 0;
}

/* Returns once no press can reach on_press any more. */
void unregister_hot_key(void *hot_key) {
	on_main_thread(hot_key, uninstall);
	free(hot_key);
}
