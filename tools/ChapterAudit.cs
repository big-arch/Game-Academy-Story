using System;
using System.Collections.Generic;

// Build-time C# only. Mobile gameplay remains JavaScript and needs no .NET runtime.
public static class ChapterAudit
{
    public static string Validate(string[] facts, string[] outputs, string[][] needs)
    {
        if (facts.Length == 0 || facts.Length > 24 || outputs.Length != needs.Length)
            throw new ArgumentException("Invalid chapter manifest size.");
        var positions = new Dictionary<string, int>();
        for (int i = 0; i < facts.Length; i++)
        {
            if (positions.ContainsKey(facts[i])) throw new ArgumentException("Duplicate fact.");
            positions.Add(facts[i], 1 << i);
        }
        if (!positions.ContainsKey("delivered")) throw new ArgumentException("Missing finale.");
        int finish = positions["delivered"];
        var required = new int[outputs.Length];
        var effects = new int[outputs.Length];
        for (int i = 0; i < outputs.Length; i++)
        {
            if (!positions.ContainsKey(outputs[i])) throw new ArgumentException("Unknown output.");
            effects[i] = positions[outputs[i]];
            foreach (var fact in needs[i])
            {
                if (!positions.ContainsKey(fact)) throw new ArgumentException("Unknown prerequisite.");
                required[i] |= positions[fact];
            }
        }
        var seen = new HashSet<int> {0};
        var queue = new Queue<int>();
        queue.Enqueue(0);
        while (queue.Count > 0)
        {
            int state = queue.Dequeue();
            for (int i = 0; i < effects.Length; i++)
            {
                if ((state & required[i]) != required[i]) continue;
                int next = state | effects[i];
                if (seen.Add(next)) queue.Enqueue(next);
            }
            if (seen.Count > 25000) throw new InvalidOperationException("Graph exceeds audit budget.");
        }
        // Every reachable knowledge state must still be able to reach the finale.
        foreach (int state in seen)
        {
            int closure = state;
            bool changed;
            do
            {
                int before = closure;
                for (int i = 0; i < effects.Length; i++)
                    if ((closure & required[i]) == required[i]) closure |= effects[i];
                changed = closure != before;
            } while (changed);
            if ((closure & finish) == 0) throw new InvalidOperationException("Unreachable finale.");
        }
        return "C# chapter audit: " + seen.Count + " reachable states; all can reach the finale.";
    }
}
