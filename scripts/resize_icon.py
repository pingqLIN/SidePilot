
import os
import sys
from PIL import Image

def resize_icon(input_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    sizes = [16, 48, 128]
    
    try:
        with Image.open(input_path) as img:
            # Ensure image is square, center crop if not
            width, height = img.size
            if width != height:
                size = min(width, height)
                left = (width - size) / 2
                top = (height - size) / 2
                right = (width + size) / 2
                bottom = (height + size) / 2
                img = img.crop((left, top, right, bottom))
            
            # Convert to RGBA if not already
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            for size in sizes:
                resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                output_filename = f"icon{size}.png"
                output_path = os.path.join(output_dir, output_filename)
                resized_img.save(output_path, "PNG")
                print(f"Generated {output_path}")
                
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python resize_icon.py <input_image_path>")
        sys.exit(1)
    
    input_image = sys.argv[1]
    # Assuming the script is run from project root, and icons go to extension/icons
    # But let's make output dir flexible or hardcoded to project structure
    # The user is in c:\Dev\Projects\SidePilot
    output_directory = os.path.join(os.getcwd(), "extension", "icons")
    
    resize_icon(input_image, output_directory)
