using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Entities
{
    public class RegisterQuestion
    {
        [Required(ErrorMessage ="Question 1 is required.")] 
        public string Question_1 { get; set; }
        [Required(ErrorMessage = "Question 2 is required.")]
        public string Question_2 { get; set; }
        [Required(ErrorMessage = "Question 3 is required.")]
        public string Question_3 { get; set; }
        [Required(ErrorMessage = "Question 4 is required.")]
        public string Question_4 { get; set; }
        [Required(ErrorMessage = "Question 5 is required.")]
        public string Question_5 { get; set; }
       
        public string Question_6 { get; set; } = string.Empty;
      
        public string Question_7 { get; set; } = string.Empty;
      
        public string Question_8 { get; set; } = string.Empty;
     
        public string Question_9 { get; set; } = string.Empty;

    }
}
