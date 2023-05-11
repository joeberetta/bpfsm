const { FSM } = require('../dist')

// It's just stub filler
const fillEmptyTransitionConfig = state => ({
    state,
    handleTransition: (from, to) => console.log('Running "handleTransition" for transition', from, '=>', to),
})

let i = 0

// Just put here all your transitions and bind tiny business methods to transition handlers
const transitions = {
    DoorsClosed: {
        to: [
            {
                state: 'Moving',
                onTransitionStart: (from, to, data) => console.log('We could pass some data on transition', data),
                handleTransition: (from, to, data) => console.log('Wow, and what do you see now?', data),
            },
            {
                state: 'DoorsOpen',
                onTransitionStart: () => "Sorry, you can't open the door!",
                handleTransition: () => console.log("It's unreachable"),
                onTransitionEnd: () => 'How do you think, will you see it in your terminal?',
            },
        ],
    },
    DoorsOpen: {
        to: [
            {
                state: 'DoorsClosed',
                onTransitionEnd: (from, to, data) =>
                    console.log(`It's smth like post-hook and fires after "handleTransition" for "${from}"=>"${to}"`),
                handleTransition: (from, to, data) => console.log('Look at the data prop', data),
            },
        ],
    },
    Moving: {
        to: [fillEmptyTransitionConfig('DoorsClosed')],
    },
}

const initialState = 'DoorsClosed'
const fsm = new FSM(
    {
        transitions,
        onAnyTransitionStart: () => (i++, console.log('Transition', i, 'started')),
        onAnyTransitionEnd: () => console.log('Transition', i, 'completed'),
        onError: (from, to, errorMsg) => console.log('Transition', i, 'failed with message:', errorMsg),
    },
    initialState,
)

;(async () => {
    await fsm.transitionTo('Moving')
    await fsm.transitionTo('DoorsClosed')
    await fsm.transitionTo('Moving', { someProp: 'someVal' })
    await fsm.transitionTo('DoorsOpen')
    await fsm.transitionTo('DoorsClosed')
})()
