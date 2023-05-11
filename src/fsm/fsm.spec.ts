import { of } from 'rxjs'

import { FSM } from './fsm'
import { Transitions } from './types'
import { fillEmptyTransitionDestination } from '../utils/testing'

describe('Finite State Machine', () => {
    type TestState = 'DoorsClosed' | 'DoorsOpen' | 'Moving'

    const fillEmptyTestTransitionDestination = fillEmptyTransitionDestination<TestState>

    const transitions: Transitions<TestState> = {
        DoorsClosed: {
            to: [fillEmptyTestTransitionDestination('Moving'), fillEmptyTestTransitionDestination('DoorsOpen')],
        },
        DoorsOpen: {
            to: [fillEmptyTestTransitionDestination('DoorsClosed')],
        },
        Moving: {
            to: [fillEmptyTestTransitionDestination('DoorsClosed')],
        },
    }

    it('initialState works', () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>({ transitions }, initialState)

        expect(fsm.initialState).toBe(initialState)
    })

    it('getNextStates() works', () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>({ transitions }, initialState)

        expect(JSON.stringify(fsm.getNextStates())).toEqual(
            JSON.stringify([
                fillEmptyTestTransitionDestination('Moving'),
                fillEmptyTestTransitionDestination('DoorsOpen'),
            ]),
        )
    })

    it('allows valid transitions', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>({ transitions }, initialState)

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe('Moving')
        await fsm.transitionTo('DoorsClosed')
        expect(fsm.currentState).toBe('DoorsClosed')
        await fsm.transitionTo('DoorsOpen')
        expect(fsm.currentState).toBe('DoorsOpen')
        await fsm.transitionTo('DoorsClosed')
        expect(fsm.currentState).toBe('DoorsClosed')
    })

    it('does not allow invalid transitions', async () => {
        const initialState = 'DoorsOpen'
        const fsm = new FSM<TestState>({ transitions }, initialState)

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe('DoorsOpen')
        await fsm.transitionTo('DoorsClosed')
        expect(fsm.currentState).toBe('DoorsClosed')
        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe('Moving')
        await fsm.transitionTo('DoorsOpen')
        expect(fsm.currentState).toBe('Moving')
    })

    it('onAnyTransitionStart() is invoked before a transition takes place', () => {
        const initialState = 'DoorsClosed'
        const spy = jest.fn()
        const data = 123
        let currentStateDuringCallback = ''
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: spy.mockImplementation(() => {
                    currentStateDuringCallback = fsm.currentState
                }),
            },
            initialState,
        )

        fsm.transitionTo('Moving', data)

        expect(spy).toHaveBeenCalledWith(initialState, 'Moving', data)
        expect(currentStateDuringCallback).toBe(initialState)
    })

    it('onTransitionStart() is invoked before a transition takes place', () => {
        const initialState = 'DoorsClosed'
        const nextState = 'Moving'
        const spy = jest.fn()
        const data = 123
        let currentStateDuringCallback = ''
        const fsm = new FSM<TestState>(
            {
                transitions: Object.assign<Transitions<TestState>, Partial<Transitions<TestState>>>(transitions, {
                    [initialState]: {
                        to: [
                            {
                                state: nextState,
                                onTransitionStart: spy.mockImplementation(() => {
                                    currentStateDuringCallback = fsm.currentState
                                }),
                                handleTransition: () => {},
                            },
                        ],
                    },
                }),
            },
            initialState,
        )

        fsm.transitionTo(nextState, data)

        expect(spy).toHaveBeenCalledWith(initialState, nextState, data)
        expect(currentStateDuringCallback).toBe(initialState)
    })

    it('onAnyTransitionEnd() is invoked after a transition takes place', async () => {
        const initialState = 'DoorsClosed'
        const nextState = 'Moving'
        const data = 123
        let currentStateDuringCallback = ''
        let nextStateDuringCallback = ''
        const spy = jest.fn(() => {
            ;(currentStateDuringCallback = initialState), (nextStateDuringCallback = nextState)
        })

        const fsmConfig = {
            transitions,
            onAnyTransitionEnd: spy,
        }

        const fsm = new FSM<TestState>(fsmConfig, initialState)

        await fsm.transitionTo(nextState, data)

        expect(spy).toHaveBeenCalledWith(initialState, nextState, data)
        expect(currentStateDuringCallback).toBe(initialState)
        expect(nextStateDuringCallback).toBe(nextState)
    })

    it('onTransitionEnd() is invoked after a transition takes place', async () => {
        const initialState = 'DoorsClosed'
        const nextState = 'Moving'
        const data = 123
        let currentStateDuringCallback = ''

        transitions.DoorsClosed.to[0].onTransitionEnd = () => {}
        const fsmConfig = { transitions }

        const spiedHandler = jest
            .spyOn(fsmConfig.transitions.DoorsClosed.to[0], 'onTransitionEnd')
            .mockImplementation(() => {
                currentStateDuringCallback = fsm.currentState
            })

        const fsm = new FSM<TestState>(fsmConfig, initialState)

        await fsm.transitionTo(nextState, data)
        expect(spiedHandler).toHaveBeenCalledWith(initialState, nextState, data)
        expect(currentStateDuringCallback).toBe(nextState)
    })

    it('onAnyTransitionStart() cancels transition when it returns false', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => false,
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe(initialState)
    })

    it('onAnyTransitionStart() cancels transition when it returns Promise<false>', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => Promise.resolve(false),
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe(initialState)
    })

    it('onAnyTransitionStart() cancels transition when it returns Observable<false>', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => of(false),
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe(initialState)
    })

    it('onAnyTransitionStart() cancels transition when it returns a string', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => 'foo',
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe(initialState)
    })

    it('onAnyTransitionStart() allows transition when it returns true', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => true,
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe('Moving')
    })

    it('onAnyTransitionStart() allows transition when it returns void', async () => {
        const initialState = 'DoorsClosed'
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => {
                    /* empty */
                },
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(fsm.currentState).toBe('Moving')
    })

    it('onError() is invoked for invalid transitions', async () => {
        const initialState = 'DoorsOpen'
        const spy = jest.fn()
        const fsm = new FSM<TestState>(
            {
                transitions,
                onError: spy,
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(spy).toHaveBeenCalledWith(
            initialState,
            'Moving',
            'Unsupported transition from state "DoorsOpen" to state "Moving"',
        )
    })

    it('onAnyTransitionStart() invokes onError() if it returns a string', async () => {
        const initialState = 'DoorsClosed'
        const spy = jest.fn()
        const fsm = new FSM<TestState>(
            {
                transitions,
                onAnyTransitionStart: () => 'error',
                onError: spy,
            },
            initialState,
        )

        await fsm.transitionTo('Moving')
        expect(spy).toHaveBeenCalledWith(initialState, 'Moving', 'error')
    })
})
