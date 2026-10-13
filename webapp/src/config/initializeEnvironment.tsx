import { getAzureStorageBaseUrl, getAzureStorageContainer, getSniperFaviconUrl, getSniperLogoUrl } from "@/utils/azureStorage";

const initializeEnvironment = () => {
  const env = {
    APP_NAME: import.meta.env.VITE_APP_NAME || "Sniper Assist",
    APP_ENV: import.meta.env.VITE_APP_ENV || "development",
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
    ZEPTO_BASE_URL: import.meta.env.VITE_ZEPTO_BASE_URL || "smtp.zeptomail.in",
    APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
    ENABLE_LOGS: import.meta.env.VITE_ENABLE_LOGS === "true",
    DEFAULT_CURRENCY: import.meta.env.VITE_DEFAULT_CURRENCY || "INR",
    DATE_FORMAT: import.meta.env.VITE_DATE_FORMAT || "DD/MM/YYYY",
    AZURE_STORAGE_BASE_URL: getAzureStorageBaseUrl(),
    AZURE_STORAGE_CONTAINER: getAzureStorageContainer(),
    CLEO_LOGO_URL: getSniperLogoUrl(),
    CLEO_FAVICON_URL: getSniperFaviconUrl(),
  };

  if (env.ENABLE_LOGS) {
    // eslint-disable-next-line no-console
    console.log("Environment Initialized:", env);
  }

  return env;
};

const ENV = initializeEnvironment();

export default ENV;
