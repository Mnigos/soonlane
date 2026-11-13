# ADR 0018: Subtasks as task rows

**Status:** Proposed
**Date:** 2026-11-13

## Context

SOON-105 lets a task be broken into subtasks, up to 4 levels below a top-level task and 50 per task (`PRODUCT.md`). A subtask is a full task: it can have a date, labels, a repeat rule and a goal. Completing a task completes its open subtasks, its Undo must reopen exactly those, and a repeating task moving to its next occurrence reopens its subtasks. Four code paths complete or advance a task (`complete`, `logProgress`, an edit that reaches a goal, and its Undo through `uncomplete`), and every query on `task` goes through the owner filter (`ownedTasks`).

## Decision

- A subtask is a row of `task` with `parent_id`. No separate table, so lists, search, labels, the calendar feed and the Dock badge keep working on one shape. Terms are in [`UBIQUITOUS_LANGUAGE.md`](../../UBIQUITOUS_LANGUAGE.md).
- The parent link is a composite foreign key `task_parent_fkey (owner_id, parent_id) -> task(owner_id, id) ON DELETE CASCADE`, backed by the unique index `task_owner_id_key`. The database makes a subtask under another owner's task impossible, even from a writer outside `ownedTasks` (the Todoist import inserts into `task` directly), and deleting a task deletes its subtree with its label links.
- `depth` is stored (0 for a top-level task), written once at insert from the parent, and checked by `task_depth_range` and `task_parent_depth`. Subtasks never move: `parentId` exists only on `tasks.create`, and a subtask's project follows its top-level task (`SubtaskProjectLocked` on an edit that sends another). Without moves there are no cycles, depth cannot go stale and no trigger is needed.
- A cascade stamps the open subtasks with the task's own `completed_at`. Reopening the task reopens the subtasks carrying that exact stamp at millisecond precision, so Undo needs no new column and no ids from the client. Completing never overwrites a stamp. Undo of an advance moves the subtasks' dates back but leaves the subtasks it reopened open. A completed task never moves to its next occurrence, so a stale tick on a repeating subtask its parent completed changes nothing.
- No open task sits under a completed one: reopening a subtask reopens its completed ancestors, and a completed task takes no new subtask (`ParentTaskCompleted`). Otherwise an undated open subtask would show nowhere. A subtask or ancestor that a reopen reopens at its goal's target drops to one below it, repeating or not, so its next edit or log does not complete or advance it again.
- Every write that can reach other tasks of a tree, delete included, first runs `ownedTasks.lockPath(id)`, which locks the task and its ancestors ordered by depth, then id. Bulk rescheduling locks the lineages of all its tasks in one statement in the same order (`lockPaths`), and deleting a project locks its tasks in that order before `ON DELETE SET NULL` writes them. Writes in one tree queue on the root's row: the 50-subtask count cannot race, a cascade sees every subtask created before it, and every locker takes rows in one total order, so tree writes never deadlock with each other. One case remains: a task moved into a project while that project is deleted is outside the delete's ordered lock, so Postgres can abort one of the two requests.
- Subtrees and ancestors are read with recursive CTEs in `owned-tasks.query.ts` that carry the owner condition at every step; the cascades in `task-tree.query.ts` use only `ownedTasks`, so `TASK_STATEMENT_FILES` gains no entry.
- Open lists show top-level tasks and dated subtasks (`SHOWN_IN_LISTS`); an undated subtask shows only under its parent through `tasks.listSubtasks`, one level per call. `Task` carries `parent`, `depth` and `subtasks` (direct counts) instead of nesting tasks.

## Consequences

- Moving a subtask, or turning a task into one, needs a new decision: depth would go stale and cycles become possible.
- Each list call runs up to two more batched queries (parent titles, subtask counts), indexed by `task_owner_parent_idx`.
- A repeating subtask whose date its parent's advance moved keeps its old repeat anchor.
- A deadlock abort (`40P01`) reaches the client as an internal error; retrying such transactions is a follow-up.
- The Todoist import nests a subtask under its parent when both arrive in the same import, within the depth and 50-subtask limits, parents inserted first. It cannot link a subtask to a parent from an earlier import: `imported_todoist_task` keeps no task id.

## Related

- ADR 0014: repositories without ports
- `ARCHITECTURE.md`: API module map
- `PRODUCT.md`: Scope, Subtasks
