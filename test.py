from bs4 import BeautifulSoup
import csv
import os


def handle_html(file_path):
    parsed_html = ""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_html = f.read()
            parsed_html = BeautifulSoup(raw_html, "html.parser")
        print(f"File at path {file_path} read successfully")
    except FileNotFoundError:
        print(f"File not found at path {file_path}")
    except Exception as e:
        print(f"Exception occured {e}")
    return parsed_html


def handle_parsed_html(parsed_html):
    all_rows = parsed_html.find_all("tr")
    heads = all_rows[0].find_all("th")
    rows = all_rows[1:]
    headings = []
    for head in heads:
        headings.append(head.text.strip())
    data = []
    if len(rows) == 1:
        return None
    else:
        for row in rows:
            temp1 = []
            temp2 = row.find_all("td")
            for item in temp2:
                temp1.append(item.text.strip())
            data.append(temp1)
        return [*data]


def html_to_csv(file_name, html_folder, csv_folder):
    html_path = os.path.join(html_folder, f"{file_name}.html")
    csv_path = os.path.join(csv_folder, f"{file_name}.csv")
    data = handle_parsed_html(handle_html(html_path))
    if data is None:
        return None
    else:
        with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(data)
        return None


html_folder = "./rawHtml/"
csv_folder = "./testcsv/"

for filename in os.listdir(html_folder):
    html_to_csv(filename.removesuffix(".html"), html_folder, csv_folder)
