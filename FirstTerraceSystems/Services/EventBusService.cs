using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Services
{
    internal class EventBusService
    {

        private readonly Dictionary<string, List<Action<object>>> _subscriptions = new();

        public void Subscribe(string eventName, Action<object> handler)
        {
            if (!_subscriptions.ContainsKey(eventName))
            {
                _subscriptions[eventName] = [];
            }
            _subscriptions[eventName].Add(handler);
        }

        public void Unsubscribe(string eventName, Action<object> handler)
        {
            if (_subscriptions.TryGetValue(eventName, out List<Action<object>>? value))
            {
                value.Remove(handler);
            }
        }

        public void Publish(string eventName, object eventData)
        {
            if (!_subscriptions.TryGetValue(eventName, out List<Action<object>>? value)) return;
            foreach (var handler in value)
            {
                handler(eventData);
            }
        }
    }
}
