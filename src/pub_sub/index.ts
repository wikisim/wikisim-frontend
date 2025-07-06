
interface PublishableEvents
{
    search_for_reference: {
        // Identifier of which DOM component is requesting the search
        search_requester_id: string
    }
    search_for_reference_completed: {
        // Identifier of which DOM component is requesting the search
        search_requester_id: string
        data_component_id: number
    }
}
type PublishableEventTypes = keyof PublishableEvents
type AllSubscribers = { [K in keyof PublishableEvents]?: {
    callback: (data: PublishableEvents[K]) => void, subscriber_id: string
}[] }
const ALL_SUBSCRIBERS: AllSubscribers = {}
const pub_sub = {
    pub: <K extends PublishableEventTypes>(event: K, data: PublishableEvents[K]) =>
    {
        const subscribers = ALL_SUBSCRIBERS[event]
        if (!subscribers) return
        subscribers.forEach(subscriber => {
            try {
                subscriber.callback(data)
            } catch (e) {
                console.error(`Error in subscriber "${subscriber.subscriber_id}" for event "${event}":`, e)
            }
        })
    },
    sub: <K extends PublishableEventTypes>(event: K, callback: (data: PublishableEvents[K]) => void, subscriber_id: string = "unknown") =>
    {
        if (!ALL_SUBSCRIBERS[event])
        {
            ALL_SUBSCRIBERS[event] = []
        }
        ALL_SUBSCRIBERS[event].push({ callback, subscriber_id })

        const unsubscribe = () =>
        {
            // console .log(`Unsubscribing "${subscriber_id}" from event "${event}"`, ALL_SUBSCRIBERS[event])
            const subscribers = ALL_SUBSCRIBERS[event]!
            ALL_SUBSCRIBERS[event] = subscribers.filter(subscriber => subscriber.callback !== callback) as typeof subscribers
            // console .log(`Unsubscribed "${subscriber_id}" from event "${event}"`, ALL_SUBSCRIBERS[event])
        }

        return unsubscribe
    },
}

export default pub_sub
