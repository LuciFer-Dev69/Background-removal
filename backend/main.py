import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove
from PIL import Image
import io

app = FastAPI()

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Rana.bg API is running"}

@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    # Read the file
    content = await file.read()
    
    # Process image
    input_image = Image.open(io.BytesIO(content))
    output_image = remove(input_image)
    
    # Return as PNG blob
    img_byte_arr = io.BytesIO()
    output_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Return bytes directly (FastAPI handles standard response)
    # We return standard Response with media type
    from fastapi.responses import Response
    return Response(content=img_byte_arr.getvalue(), media_type="image/png")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
