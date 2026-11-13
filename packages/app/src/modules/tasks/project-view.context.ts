import type { ProjectId } from '@soonlane/domain'
import { createContext } from 'react'

/** The project whose view renders the task rows; they leave its name out. */
export const ProjectViewContext = createContext<ProjectId | undefined>(
	undefined
)
