import { fillEmptyTransitionDestination } from '../utils/testing'
import { Transitions } from './types'
import { validateTransitionDefinition } from './validate-transition-definition'

export type OrderState =
    | 'Created'
    | 'Draft'
    | 'AddingItems'
    | 'ArrangingPayment'
    | 'PaymentAuthorized'
    | 'PaymentSettled'
    | 'PartiallyShipped'
    | 'Shipped'
    | 'PartiallyDelivered'
    | 'Delivered'
    | 'Modifying'
    | 'ArrangingAdditionalPayment'
    | 'Cancelled'

describe('FSM validateTransitionDefinition()', () => {
    it('valid definition', () => {
        const valid: Transitions<'Start' | 'End'> = {
            Start: { to: [fillEmptyTransitionDestination<'Start' | 'End'>('End')] },
            End: { to: [fillEmptyTransitionDestination<'Start' | 'End'>('Start')] },
        }

        const result = validateTransitionDefinition(valid, 'Start')

        expect(result.valid).toBe(true)
    })

    it('valid complex definition', () => {
        const fillOrderStateTransitionDestination = fillEmptyTransitionDestination<OrderState>
        const orderStateTransitions: Transitions<OrderState> = {
            Created: {
                to: [fillOrderStateTransitionDestination('AddingItems'), fillOrderStateTransitionDestination('Draft')],
            },
            Draft: {
                to: [fillOrderStateTransitionDestination('ArrangingPayment')],
            },
            AddingItems: {
                to: [
                    fillOrderStateTransitionDestination('ArrangingPayment'),
                    fillOrderStateTransitionDestination('Cancelled'),
                ],
            },
            ArrangingPayment: {
                to: [
                    fillOrderStateTransitionDestination('PaymentAuthorized'),
                    fillOrderStateTransitionDestination('PaymentSettled'),
                    fillOrderStateTransitionDestination('AddingItems'),
                    fillOrderStateTransitionDestination('Cancelled'),
                    fillOrderStateTransitionDestination('Modifying'),
                ],
            },
            PaymentAuthorized: {
                to: [
                    fillOrderStateTransitionDestination('PaymentSettled'),
                    fillOrderStateTransitionDestination('Cancelled'),
                ],
            },
            PaymentSettled: {
                to: [
                    fillOrderStateTransitionDestination('PartiallyDelivered'),
                    fillOrderStateTransitionDestination('Delivered'),
                    fillOrderStateTransitionDestination('PartiallyShipped'),
                    fillOrderStateTransitionDestination('Shipped'),
                    fillOrderStateTransitionDestination('Cancelled'),
                ],
            },
            PartiallyShipped: {
                to: [
                    fillOrderStateTransitionDestination('Shipped'),
                    fillOrderStateTransitionDestination('PartiallyDelivered'),
                    fillOrderStateTransitionDestination('Cancelled'),
                ],
            },
            Shipped: {
                to: [
                    fillOrderStateTransitionDestination('PartiallyDelivered'),
                    fillOrderStateTransitionDestination('Delivered'),
                    fillOrderStateTransitionDestination('Cancelled'),
                ],
            },
            PartiallyDelivered: {
                to: [
                    fillOrderStateTransitionDestination('Delivered'),
                    fillOrderStateTransitionDestination('Cancelled'),
                ],
            },
            Delivered: {
                to: [fillOrderStateTransitionDestination('Cancelled')],
            },
            ArrangingAdditionalPayment: {
                to: [fillOrderStateTransitionDestination('ArrangingPayment')],
            },
            Modifying: {
                to: [fillOrderStateTransitionDestination('ArrangingAdditionalPayment')],
            },
            Cancelled: {
                to: [],
            },
        }

        const result = validateTransitionDefinition(orderStateTransitions, 'Created')

        expect(result.valid).toBe(true)
    })

    it('invalid - unreachable state', () => {
        const valid: Transitions<'Start' | 'End' | 'Unreachable'> = {
            Start: {
                to: [fillEmptyTransitionDestination<'Start' | 'End' | 'Unreachable'>('End')],
            },
            End: {
                to: [fillEmptyTransitionDestination<'Start' | 'End' | 'Unreachable'>('Start')],
            },
            Unreachable: { to: [] },
        }

        const result = validateTransitionDefinition(valid, 'Start')

        expect(result.valid).toBe(false)
        expect(result.error).toBe('The following states are unreachable: Unreachable')
    })
})
