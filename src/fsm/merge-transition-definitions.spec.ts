import { fillEmptyTransitionDestination } from '../utils/testing'
import { mergeTransitionDefinitions } from './merge-transition-definitions'
import { Transitions } from './types'

describe('FSM mergeTransitionDefinitions()', () => {
    type TestState = 'Start' | 'End'

    const fillEmptyTestTransitionDestination = fillEmptyTransitionDestination<TestState>

    it('handles no b', () => {
        const a: Transitions<TestState> = {
            Start: { to: [fillEmptyTestTransitionDestination('End')] },
            End: { to: [] },
        }
        const result = mergeTransitionDefinitions(a)

        expect(result).toEqual(a)
    })

    it('adding new state, merge by default', () => {
        const a: Transitions<TestState> = {
            Start: { to: [fillEmptyTestTransitionDestination('End')] },
            End: { to: [] },
        }
        const b: Transitions<'Start' | 'Cancelled'> = {
            Start: {
                to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Cancelled')],
            },
            Cancelled: { to: [] },
        }
        const result = mergeTransitionDefinitions(a, b)

        expect(JSON.stringify(result)).toEqual(
            JSON.stringify({
                Start: {
                    to: [
                        fillEmptyTestTransitionDestination('End'),
                        fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Cancelled'),
                    ],
                },
                End: { to: [] },
                Cancelled: { to: [] },
            }),
        )
    })

    it('adding new state, replace', () => {
        const a: Transitions<TestState> = {
            Start: { to: [fillEmptyTestTransitionDestination('End')] },
            End: { to: [] },
        }
        const b: Transitions<'Start' | 'Cancelled'> = {
            Start: {
                to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Cancelled')],
                mergeStrategy: 'replace',
            },
            Cancelled: {
                to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Start')],
            },
        }
        const result = mergeTransitionDefinitions(a, b)

        expect(JSON.stringify(result)).toEqual(
            JSON.stringify({
                Start: {
                    to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Cancelled')],
                },
                End: { to: [] },
                Cancelled: {
                    to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Start')],
                },
            }),
        )
    })

    it('is an idempotent, pure function', () => {
        const a: Transitions<TestState> = {
            Start: { to: [fillEmptyTestTransitionDestination('End')] },
            End: { to: [] },
        }
        const aCopy = { ...a }
        const b: Transitions<'Start' | 'Cancelled'> = {
            Start: {
                to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Cancelled')],
            },
            Cancelled: {
                to: [fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Start')],
            },
        }
        let result = mergeTransitionDefinitions(a, b)
        result = mergeTransitionDefinitions(a, b)

        expect(JSON.stringify(a)).toEqual(JSON.stringify(aCopy))
        expect(JSON.stringify(result)).toEqual(
            JSON.stringify({
                Start: {
                    to: [
                        fillEmptyTestTransitionDestination('End'),
                        fillEmptyTransitionDestination<'Start' | 'Cancelled'>('Cancelled'),
                    ],
                },
                End: { to: [] },
                Cancelled: { to: [fillEmptyTestTransitionDestination('Start')] },
            }),
        )
    })
})
