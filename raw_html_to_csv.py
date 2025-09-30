from bs4 import BeautifulSoup
import csv
import os
from datetime import datetime


# Raw HTML to individual CSV
def handle_html(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_html = f.read()
            if raw_html == "NO_DATA":
                return None
            parsed_html = BeautifulSoup(raw_html, "html.parser")
        print(f"File at path {file_path} read successfully")
        return parsed_html
    except FileNotFoundError:
        print(f"File not found at path {file_path}")
    except Exception as e:
        print(f"Exception occured {e}")
    return None


def handle_parsed_html(parsed_html):
    if parsed_html is None:
        return None
    all_rows = parsed_html.find_all("tr")
    if not all_rows:
        return None

    # Extract headings
    heads = all_rows[0].find_all("th")
    headings = [head.text.strip() for head in heads]

    # Extract data rows
    rows = all_rows[1:]
    data = []
    for row in rows:
        cells = row.find_all("td")
        row_data = [cell.text.strip().replace(",", "") for cell in cells]
        data.append(row_data)

    return [headings, *data]


def html_to_csv(file_name, html_folder, csv_folder):
    html_path = os.path.join(html_folder, f"{file_name}.html")
    csv_path = os.path.join(csv_folder, f"{file_name}.csv")
    data = handle_parsed_html(handle_html(html_path))
    if data:
        with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(data)


# Combine into a single csv
def combine_csv(csv_folder, combined_file_path):
    csv_files = sorted(
        [f for f in os.listdir(csv_folder) if f.endswith(".csv")],
        key=lambda x: datetime.strptime(x[:-4], "%Y-%m-%d"),  # Sort chronologically
    )

    combined_data = []
    for i, file in enumerate(csv_files):
        path = os.path.join(csv_folder, file)
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            rows = list(reader)
            if i == 0:
                # Keep header from first CSV only
                combined_data.extend(rows)
            else:
                combined_data.extend(rows[1:])  # Skip header

    with open(combined_file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(combined_data)

    print(f"All CSVs combined into {combined_file_path}")


# Main
html_folder = "./raw_html/"
csv_folder = "./raw_csv/"
os.makedirs(csv_folder, exist_ok=True)

# Convert HTMLs to CSV
for filename in os.listdir(html_folder):
    if filename.endswith(".html"):
        html_to_csv(filename.removesuffix(".html"), html_folder, csv_folder)

# Combine all CSVs
combined_file_path = os.path.join(csv_folder, "combined_market_data.csv")
combine_csv(csv_folder, combined_file_path)
