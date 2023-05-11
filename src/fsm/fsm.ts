import { awaitPromiseOrObservable } from '../utils/await-promise-or-observable'

import { StateMachineConfig, TransitionConfig } from './types'

/**
 * @description
 * A simple type-safe finite state machine. This is used internally to control the Order process, ensuring that
 * the state of Orders, Payments, Fulfillments and Refunds follows a well-defined behaviour.
 *
 * @docsCategory StateMachine
 */
export class FSM<T extends string, Data = any> {
    private readonly _initialState: T
    private _currentState: T

    constructor(private config: StateMachineConfig<T, Data>, initialState: T) {
        this._currentState = initialState
        this._initialState = initialState
    }

    /**
     * Returns the state with which the FSM was initialized.
     */
    get initialState(): T {
        return this._initialState
    }

    /**
     * Returns the current state.
     */
    get currentState(): T {
        return this._currentState
    }

    /**
     * Attempts to transition from the current state to the given state. If this transition is not allowed
     * per the config, then an error will be logged.
     */
    async transitionTo(state: T, data?: Data): Promise<void>
    async transitionTo(state: T, data: Data) {
        const currentTransition = this.canTransitionTo(state)
        if (currentTransition) {
            // If the onAnyTransitionStart callback is defined, invoke it. If it returns false,
            // then the transition will be cancelled.
            if (typeof this.config.onAnyTransitionStart === 'function') {
                const canTransition = await awaitPromiseOrObservable(
                    this.config.onAnyTransitionStart(this._currentState, state, data),
                )
                if (canTransition === false) {
                    return
                } else if (typeof canTransition === 'string') {
                    await this.onError(this._currentState, state, canTransition)
                    return
                }
            }
            // If the onTransitionStart callback is defined for current transition from given state to next, invoke it. If it returns false,
            // then the transition will be cancelled.
            if (typeof currentTransition.onTransitionStart === 'function') {
                const canTransition = await awaitPromiseOrObservable(
                    currentTransition.onTransitionStart(this._currentState, state, data),
                )
                if (canTransition === false) {
                    return
                } else if (typeof canTransition === 'string') {
                    await this.onError(this._currentState, state, canTransition)
                    return
                }
            }

            const fromState = this._currentState
            await awaitPromiseOrObservable(currentTransition.handleTransition(fromState, state, data))
            // All is well, so transition to the new state.
            this._currentState = state

            // If the onTransitionEnd callback is defined, invoke it.
            if (typeof currentTransition.onTransitionEnd === 'function') {
                await awaitPromiseOrObservable(currentTransition.onTransitionEnd(fromState, state, data))
            }

            // If the onAnyTransitionEnd callback is defined, invoke it.
            if (typeof this.config.onAnyTransitionEnd === 'function') {
                await awaitPromiseOrObservable(this.config.onAnyTransitionEnd(fromState, state, data))
            }
        } else {
            return this.onError(
                this._currentState,
                state,
                `Unsupported transition from state "${this._currentState}" to state "${state}"`,
            )
        }
    }

    /**
     * Jumps from the current state to the given state without regard to whether this transition is allowed or not.
     * None of the lifecycle callbacks will be invoked.
     */
    jumpTo(state: T) {
        this._currentState = state
    }

    /**
     * Returns an array of state to which the machine may transition from the current state.
     */
    getNextStates(): ReadonlyArray<TransitionConfig<T, Data>> {
        return this.config.transitions[this._currentState]?.to ?? []
    }

    /**
     * Returns true if the machine can transition from its current state to the given state.
     */
    canTransitionTo(state: T): TransitionConfig<T, Data> | false {
        return this.config.transitions[this._currentState]?.to?.find?.(t => t.state === state) ?? false
    }

    private async onError(fromState: T, toState: T, message?: string) {
        if (typeof this.config.onError === 'function') {
            await awaitPromiseOrObservable(this.config.onError(fromState, toState, message))
        }
    }
}
