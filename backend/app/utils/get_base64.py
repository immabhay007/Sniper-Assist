import base64
import requests

# --- Helper to download blob and return base64 ---
def get_base64_from_url(file_url: str) -> str:
    try:
        # Option 1: Direct download via HTTP GET (if URL is public or has SAS)
        response = requests.get(file_url, timeout=10)
        response.raise_for_status()
        return base64.b64encode(response.content).decode("utf-8")
    except Exception:
        # Option 2: Use Azure SDK if you have connection string (more secure)
        # from azure.storage.blob import BlobServiceClient
        # blob_service_client = BlobServiceClient.from_connection_string(...)
        # container_name = "cleo-enquiry-complaint"
        # blob_name = file_url.split("/")[-1]  # extract from URL
        # blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
        # data = blob_client.download_blob().readall()
        # return base64.b64encode(data).decode("utf-8")
        return None  # or raise