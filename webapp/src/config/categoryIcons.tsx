import {
  HiOutlineAcademicCap,
  HiOutlineBadgeCheck,
  HiOutlineBeaker,
  HiOutlineBell,
  HiOutlineBookOpen,
  HiOutlineBookmark,
  HiOutlineBriefcase,
  HiOutlineCake,
  HiOutlineCalculator,
  HiOutlineCamera,
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineChip,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCloud,
  HiOutlineCog,
  HiOutlineCollection,
  HiOutlineCreditCard,
  HiOutlineCube,
  HiOutlineCurrencyRupee,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineDocumentText,
  HiOutlineDotsCircleHorizontal,
  HiOutlineFilm,
  HiOutlineFire,
  HiOutlineFlag,
  HiOutlineGift,
  HiOutlineGlobe,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineIdentification,
  HiOutlineInbox,
  HiOutlineKey,
  HiOutlineLibrary,
  HiOutlineLightningBolt,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlineMap,
  HiOutlineMicrophone,
  HiOutlineMusicNote,
  HiOutlineNewspaper,
  HiOutlineOfficeBuilding,
  HiOutlinePaperAirplane,
  HiOutlinePhone,
  HiOutlinePhotograph,
  HiOutlinePresentationChartLine,
  HiOutlinePrinter,
  HiOutlinePuzzle,
  HiOutlineReceiptRefund,
  HiOutlineRefresh,
  HiOutlineScale,
  HiOutlineScissors,
  HiOutlineSearch,
  HiOutlineServer,
  HiOutlineShieldCheck,
  HiOutlineShoppingCart,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineSun,
  HiOutlineSupport,
  HiOutlineTable,
  HiOutlineTag,
  HiOutlineTemplate,
  HiOutlineTerminal,
  HiOutlineThumbUp,
  HiOutlineTicket,
  HiOutlineTrendingUp,
  HiOutlineTruck,
  HiOutlineUpload,
  HiOutlineUser,
  HiOutlineVideoCamera,
  HiOutlineViewGrid,
  HiOutlineVolumeUp,
  HiOutlineWifi,
} from "react-icons/hi";
import {
  BiBook,
  BiBox,
  BiBriefcase,
  BiBrush,
  BiBuilding,
  BiBulb,
  BiBus,
  BiCalculator,
  BiCalendar,
  BiCamera,
  BiCar,
  BiCart,
  BiCoffee,
  BiCreditCard,
  BiDesktop,
  BiDrink,
  BiDumbbell,
  BiEnvelope,
  BiFirstAid,
  BiFolder,
  BiFoodMenu,
  BiGasPump,
  BiGift,
  BiGlobe,
  BiHardHat,
  BiHeart,
  BiHome,
  BiLaptop,
  BiLeaf,
  BiMap,
  BiMoney,
  BiPackage,
  BiPaint,
  BiRestaurant,
  BiRun,
  BiShield,
  BiStore,
  BiTaxi,
  BiTrain,
  BiWallet,
  BiWater,
  BiWorld,
  BiWrench,
} from "react-icons/bi";

/** Saved in DB as category_icon (React Icons export name). */
export const DEFAULT_CATEGORY_ICON_KEY = "HiOutlineDotsCircleHorizontal";

/**
 * Updated for Sniper Assist Portal – Helpdesk Categories.
 * Each icon now has an `applicableTo` array so the frontend can filter icons
 * based on whether the user is creating a Complaint or an Enquiry category.
 */
export const CATEGORY_ICON_PRESETS: {
  name: string;
  Icon: any;
  applicableTo: ("complaint" | "enquiry")[];
}[] = [
  // ===================== COMPLAINT-SPECIFIC ICONS =====================
  {
    name: "HiOutlineShieldCheck",
    Icon: HiOutlineShieldCheck,
    applicableTo: ["complaint"],
  },
  { name: "HiOutlineFire", Icon: HiOutlineFire, applicableTo: ["complaint"] },
  {
    name: "HiOutlineUser",
    Icon: HiOutlineUser,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineIdentification",
    Icon: HiOutlineIdentification,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineScissors",
    Icon: HiOutlineScissors,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineBeaker",
    Icon: HiOutlineBeaker,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineStar",
    Icon: HiOutlineStar,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineThumbUp",
    Icon: HiOutlineThumbUp,
    applicableTo: ["complaint"],
  },
  {
    name: "BiBrush",
    Icon: BiBrush,
    applicableTo: ["complaint"],
  },
  {
    name: "BiPaint",
    Icon: BiPaint,
    applicableTo: ["complaint"],
  },
  {
    name: "BiWrench",
    Icon: BiWrench,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineHome",
    Icon: HiOutlineHome,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineTruck",
    Icon: HiOutlineTruck,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineClock",
    Icon: HiOutlineClock,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineReceiptRefund",
    Icon: HiOutlineReceiptRefund,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineCreditCard",
    Icon: HiOutlineCreditCard,
    applicableTo: ["complaint"],
  },
  {
    name: "BiCreditCard",
    Icon: BiCreditCard,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineDocumentText",
    Icon: HiOutlineDocumentText,
    applicableTo: ["complaint"],
  },
  {
    name: "HiOutlineClipboardList",
    Icon: HiOutlineClipboardList,
    applicableTo: ["complaint"],
  },

  // ===================== ENQUIRY-SPECIFIC ICONS =====================
  {
    name: "HiOutlineCurrencyRupee",
    Icon: HiOutlineCurrencyRupee,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineCash",
    Icon: HiOutlineCash,
    applicableTo: ["enquiry"],
  },
  {
    name: "BiCalculator",
    Icon: BiCalculator,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineGlobe",
    Icon: HiOutlineGlobe,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineLocationMarker",
    Icon: HiOutlineLocationMarker,
    applicableTo: ["enquiry"],
  },
  {
    name: "BiMap",
    Icon: BiMap,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineMap",
    Icon: HiOutlineMap,
    applicableTo: ["enquiry"],
  },
  {
    name: "BiCalendar",
    Icon: BiCalendar,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineBadgeCheck",
    Icon: HiOutlineBadgeCheck,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineBriefcase",
    Icon: HiOutlineBriefcase,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineOfficeBuilding",
    Icon: HiOutlineOfficeBuilding,
    applicableTo: ["enquiry"],
  },
  {
    name: "BiBuilding",
    Icon: BiBuilding,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlinePaperAirplane",
    Icon: HiOutlinePaperAirplane,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlinePhone",
    Icon: HiOutlinePhone,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineMail",
    Icon: HiOutlineMail,
    applicableTo: ["enquiry"],
  },
  {
    name: "BiEnvelope",
    Icon: BiEnvelope,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineRefresh",
    Icon: HiOutlineRefresh,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineSparkles",
    Icon: HiOutlineSparkles,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineBell",
    Icon: HiOutlineBell,
    applicableTo: ["enquiry"],
  },
  {
    name: "HiOutlineSupport",
    Icon: HiOutlineSupport,
    applicableTo: ["enquiry"],
  },

  // ===================== COMMON ICONS (Both Complaint & Enquiry) =====================
  {
    name: "HiOutlineDotsCircleHorizontal",
    Icon: HiOutlineDotsCircleHorizontal,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCog",
    Icon: HiOutlineCog,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineTicket",
    Icon: HiOutlineTicket,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineFlag",
    Icon: HiOutlineFlag,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlinePuzzle",
    Icon: HiOutlinePuzzle,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCollection",
    Icon: HiOutlineCollection,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCube",
    Icon: HiOutlineCube,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineTag",
    Icon: HiOutlineTag,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineBookmark",
    Icon: HiOutlineBookmark,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineInbox",
    Icon: HiOutlineInbox,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiFolder",
    Icon: BiFolder,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineSearch",
    Icon: HiOutlineSearch,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineUpload",
    Icon: HiOutlineUpload,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineViewGrid",
    Icon: HiOutlineViewGrid,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineTable",
    Icon: HiOutlineTable,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineTemplate",
    Icon: HiOutlineTemplate,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineKey",
    Icon: HiOutlineKey,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineScale",
    Icon: HiOutlineScale,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineTrendingUp",
    Icon: HiOutlineTrendingUp,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineChartBar",
    Icon: HiOutlineChartBar,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlinePresentationChartLine",
    Icon: HiOutlinePresentationChartLine,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineBookOpen",
    Icon: HiOutlineBookOpen,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineLibrary",
    Icon: HiOutlineLibrary,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineAcademicCap",
    Icon: HiOutlineAcademicCap,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiBook",
    Icon: BiBook,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineNewspaper",
    Icon: HiOutlineNewspaper,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineDeviceMobile",
    Icon: HiOutlineDeviceMobile,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineWifi",
    Icon: HiOutlineWifi,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiGlobe",
    Icon: BiGlobe,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiWorld",
    Icon: BiWorld,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineGift",
    Icon: HiOutlineGift,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiGift",
    Icon: BiGift,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineSun",
    Icon: HiOutlineSun,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiLeaf",
    Icon: BiLeaf,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCloud",
    Icon: HiOutlineCloud,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineServer",
    Icon: HiOutlineServer,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineDesktopComputer",
    Icon: HiOutlineDesktopComputer,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiDesktop",
    Icon: BiDesktop,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiLaptop",
    Icon: BiLaptop,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineChip",
    Icon: HiOutlineChip,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineTerminal",
    Icon: HiOutlineTerminal,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlinePrinter",
    Icon: HiOutlinePrinter,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCamera",
    Icon: HiOutlineCamera,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiCamera",
    Icon: BiCamera,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlinePhotograph",
    Icon: HiOutlinePhotograph,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineFilm",
    Icon: HiOutlineFilm,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineVideoCamera",
    Icon: HiOutlineVideoCamera,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineMusicNote",
    Icon: HiOutlineMusicNote,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineMicrophone",
    Icon: HiOutlineMicrophone,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineVolumeUp",
    Icon: HiOutlineVolumeUp,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineHeart",
    Icon: HiOutlineHeart,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiHeart",
    Icon: BiHeart,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiFirstAid",
    Icon: BiFirstAid,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineLightningBolt",
    Icon: HiOutlineLightningBolt,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiBulb",
    Icon: BiBulb,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiWater",
    Icon: BiWater,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCalculator",
    Icon: HiOutlineCalculator,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiMoney",
    Icon: BiMoney,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiWallet",
    Icon: BiWallet,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiShield",
    Icon: BiShield,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiBox",
    Icon: BiBox,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiPackage",
    Icon: BiPackage,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiBriefcase",
    Icon: BiBriefcase,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiHardHat",
    Icon: BiHardHat,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineShoppingCart",
    Icon: HiOutlineShoppingCart,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiCart",
    Icon: BiCart,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiStore",
    Icon: BiStore,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "HiOutlineCake",
    Icon: HiOutlineCake,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiRestaurant",
    Icon: BiRestaurant,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiFoodMenu",
    Icon: BiFoodMenu,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiCoffee",
    Icon: BiCoffee,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiDrink",
    Icon: BiDrink,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiGasPump",
    Icon: BiGasPump,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiCar",
    Icon: BiCar,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiBus",
    Icon: BiBus,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiTaxi",
    Icon: BiTaxi,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiTrain",
    Icon: BiTrain,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiRun",
    Icon: BiRun,
    applicableTo: ["complaint", "enquiry"],
  },
  {
    name: "BiDumbbell",
    Icon: BiDumbbell,
    applicableTo: ["complaint", "enquiry"],
  },
];

/** Older categories may still use short keys from before icon names were stored. */
export const LEGACY_CATEGORY_ICON_KEYS = {
  petrol: "BiGasPump",
  food: "HiOutlineCake",
  rent: "HiOutlineOfficeBuilding",
  home: "HiOutlineHome",
  emi: "BiCalendar",
  material: "BiBox",
  shopping: "HiOutlineShoppingCart",
  salary: "HiOutlineUser",
  vendor: "HiOutlineTruck",
  medical: "BiFirstAid",
  utilities: "HiOutlineLightningBolt",
  cash: "HiOutlineCash",
  documents: "HiOutlineDocumentText",
  phone: "HiOutlinePhone",
  internet: "HiOutlineWifi",
  gift: "HiOutlineGift",
  education: "HiOutlineAcademicCap",
  maintenance: "BiWrench",
  cart: "BiCart",
  rupee: "HiOutlineCurrencyRupee",
  tasks: "HiOutlineClipboardList",
  settings: "HiOutlineCog",
  health: "HiOutlineHeart",
  misc: "HiOutlineDotsCircleHorizontal",
};

export const CATEGORY_COLOR_PRESETS = [
  "#7c6ce0",
  "#22a06b",
  "#d97b3c",
  "#c84d2e",
  "#3a8cd6",
  "#8a8a8a",
  "#e85d75",
  "#5b8def",
  "#0d9488",
  "#a855f7",
];

// Build a lookup map for fast resolution
const ICON_BY_NAME = Object.fromEntries(
  CATEGORY_ICON_PRESETS.map((p) => [p.name, p.Icon])
);

export function resolveCategoryIconName(iconKey: string): string {
  const raw = String(iconKey ?? "").trim();
  if (!raw) return DEFAULT_CATEGORY_ICON_KEY;
  if (ICON_BY_NAME[raw]) return raw;
  const legacy = LEGACY_CATEGORY_ICON_KEYS[raw.toLowerCase()];
  if (legacy) return legacy;
  return DEFAULT_CATEGORY_ICON_KEY;
}

export function getCategoryIcon(iconKey: string) {
  const name = resolveCategoryIconName(iconKey);
  return ICON_BY_NAME[name] ?? HiOutlineDotsCircleHorizontal;
}

export function isKnownCategoryIconName(iconKey: string): boolean {
  const raw = String(iconKey ?? "").trim();
  if (!raw) return false;
  if (ICON_BY_NAME[raw]) return true;
  return Boolean(LEGACY_CATEGORY_ICON_KEYS[raw.toLowerCase()]);
}