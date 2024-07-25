using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Extensions
{
  public static class EnumerableExtensions
  {
    // Example extension method to chunk IEnumerable<T>
    public static IEnumerable<IEnumerable<T>> Chunk<T>(this IEnumerable<T> source, int chunkSize)
    {
      while (source.Any())
      {
        yield return source.Take(chunkSize);
        source = source.Skip(chunkSize);
      }
    }
  }
}
