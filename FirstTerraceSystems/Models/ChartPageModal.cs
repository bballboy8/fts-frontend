using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Models
{
    public class ChartPageModal
    {
        public string? ChartId { get; set; }
        public IJSRuntime? JSRuntime { get; set; }
     
    }
}
