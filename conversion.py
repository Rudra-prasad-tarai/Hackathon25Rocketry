import os

# --- Configuration ---
input_file_name = 'all-requests.txt'   # Your 13.2 MB file with all JSONs stuck together
output_file_name = 'all-requests.jsonl' # The new, correct file this script will create
# ---------------------

# 1. Define the "seam" to split on.
# This finds where one object ends (}) and the next object begins ({"messages":)
# This is safer than just splitting on '}{'
seam = '}{"messages":'

# 2. Define what to replace the seam with.
# We replace it with the end of the first object (}),
# a newline character (\n),
# and the start of the next object ({"messages":)
replacement = '}\n{"messages":'

try:
    print(f"Reading '{input_file_name}'...")
    
    # 3. Read the entire 13.2 MB file into one single string in memory
    with open(input_file_name, 'r', encoding='utf-8') as f_in:
        fused_data = f_in.read()
    
    # 4. Perform the one-line replacement
    # This finds all instances of the "seam" and replaces it with the "replacement"
    print("Splitting fused JSON objects into separate lines...")
    jsonl_data = fused_data.replace(seam, replacement)
    
    # 5. Write the new, corrected string to the output .jsonl file
    with open(output_file_name, 'w', encoding='utf-8') as f_out:
        f_out.write(jsonl_data)
        
    print(f"\n✅ Success! Your file has been converted.")
    print(f"Your new, ready-to-train file is: '{output_file_name}'")

except FileNotFoundError:
    print(f"Error: The file '{input_file_name}' was not found in this directory.")
except Exception as e:
    print(f"An error occurred: {e}")