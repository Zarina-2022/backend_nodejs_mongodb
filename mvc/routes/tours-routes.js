const express = require("express");
const { protect, restrictTo } = require("../controllers/auth-controllers");
const {
  getAllTours,
  createTour,
  getTour,
  deleteTour,
  updateTour,
  aliasBestPrices,
  getTourStats,
  getMonthlyPlan,
} = require("../controllers/tour-controllers");

const router = express.Router();

// en iyi 5 tane fiyat performans veren route:
// aslinda frontend'te getAllTours'a istek atip parametreleri gonderirse ayni sonucu alabilir.
// ama ayni sonucu almak icin cok fazla parametre girmesi gerekir.
// Bu yeni (kendimizin olusturdugu) route'a istek atildiginda parametreleri middelware ile biz belirleyecegiz.
// eger ki 'top-five-best' url'e istek atilirsa, aliasBestPrices() calissin:
// aliasBestPrices calistiktan sonra getAllTours calissin
router
  .route("/top-five-best")
  .get(protect, restrictTo("admin"), aliasBestPrices, getAllTours);

// tourlarin istatistiklerini almak icin route tanimlayalim
//gergek senariyo-1: admin paneli icin zorluga gore turlarin istatistiklerini hesaplayalim:
router.route("/tour-stats").get(protect, restrictTo("admin"), getTourStats);

// gercek senaryo-2: belirli bir yil icin her ay baslayacak olan turlari al:
// e.g. 2023'te her ay baslayacak tur sayisini hesapla. Mesele Mart- 2 tour, nisan-3 tour.
router
  .route("/monthly-plan/:year")
  .get(protect, restrictTo("admin"), getMonthlyPlan);

// router icin yollari tanimlama
router
  .route("/")
  .get( getAllTours)
  .post(protect, restrictTo("admin", "guide", "lead-guide"), createTour);

router
  .route("/:id")
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour)
  .get(getTour)
  .patch(protect, restrictTo("admin", "guide", "lead-guide"), updateTour);

// router'i index.js'e tanitmak icin export yapalim:
module.exports = router;
