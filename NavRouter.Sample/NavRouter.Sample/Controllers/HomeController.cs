namespace NavRouter.Sample.Controllers
{
    using System.Threading;
    using System.Web.Mvc;

    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Page1()
        {
            Thread.Sleep(700);
            return View();
        }

        public ActionResult Page2(string value)
        {
            Thread.Sleep(500);
            ViewBag.Value = value;
            return View();
        }

        public ActionResult Page3()
        {
            Thread.Sleep(300);
            return View();
        }
    }
}
