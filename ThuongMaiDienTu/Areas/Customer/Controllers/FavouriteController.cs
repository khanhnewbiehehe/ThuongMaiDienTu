using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ThuongMaiDienTu.Areas.Customer.Services;
using ThuongMaiDienTu.Models;

namespace ThuongMaiDienTu.Areas.Customer.Controllers
{
    [Area("Customer")]
    [Authorize(Roles = "Customer")]
    public class FavouriteController : Controller
    {
        private readonly IFavouriteCustomerService _favourite;
        private readonly UserManager<AppUser> _userManager;

        public FavouriteController(IFavouriteCustomerService favourite, UserManager<AppUser> userManager)
        {
            _favourite = favourite;
            _userManager = userManager;
        }

        [Route("Customer/Favourite")]
        public async Task<IActionResult> Index()
        {
            var user = await _userManager.GetUserAsync(User);
            var list = await _favourite.List(user.Id);
            return View(list);
        }
        [Route("Customer/Favourite/{id}")]
        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            var result = await _favourite.Delete(id, user.Id);
            return Json(result);
        }
    }
}
