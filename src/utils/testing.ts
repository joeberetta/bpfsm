import { TransitionConfig } from '../fsm/types'

export const fillEmptyTransitionDestination = <T extends string, Data = undefined>(
    state: T,
): TransitionConfig<T, Data> => ({ state, handleTransition: () => {} })
