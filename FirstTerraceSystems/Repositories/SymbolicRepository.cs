using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using SQLite;
using System.Collections;

namespace FirstTerraceSystems.Repositories
{
    internal class SymbolicRepository
    {
        private readonly SQLiteConnection _connection;

        public SymbolicRepository(SQLiteConnection connection)
        {
            _connection = connection;
        }

        public SymbolicData? GetLastRecord()
        {
            return _connection.Table<SymbolicData>().LastOrDefault();
        }

        public IEnumerable<string?>? GetAllSymbols()
        {
            var symbols = _connection.Table<SymbolicData>().Select(s => s.Symbol).Distinct();
            return symbols;
        }

        public IEnumerable<dynamic> GetSymbolicDataBySymbol(string symbol)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol).Select(x => new { t = x.TimeStamp, p = x.Price }).ToList();
            return result;
        }

        public void UpdateSymbolicDataToDBFromApi(List<SymbolicData> data)
        {
            List<SymbolicData> batch = [];
            foreach (var item in data)
            {
                //item.TimeStamp = item.Date.ToString("yyyy-MM-ddTHH:mm:ss.ffffff");
                item.TimeStamp = item.Date.ToString("yyyy-MM-ddTHH:mm:ss.ffffff");

                item.Price = item.Price / 10000;

                batch.Add(item);

                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }

            if (batch.Count > 0) _connection.InsertAll(batch);
        }

        public void UpdateSymbolicDataToDBFromSocket(NasdaqResponse data)
        {
            List<SymbolicData> batch = new();

            foreach (var item in data.Data)
            {
                batch.Add(new SymbolicData(data.Headers, item));
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }

            if (batch.Count > 0) _connection.InsertAll(batch);
        }
    }
}
