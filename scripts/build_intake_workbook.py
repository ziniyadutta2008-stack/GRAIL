"""Build the blank and sample model-owner intake workbooks.

The sample is synthetic demonstration data for upload testing. System assessment
and proposed risk tier are intentionally absent: the governance lead enters both.
"""

from __future__ import annotations

import xml.sax.saxutils as sax
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]

FIELDS: list[tuple[str, str, str]] = [
    ("system_name", "System name", "Short name of the AI system."),
    ("identifier", "Identifier", "Stable identifier, for example CLAIMS-HELPER."),
    (
        "problem_statement",
        "Problem statement",
        "The exact problem and the system being proposed.",
    ),
    (
        "goals",
        "Goals and purpose",
        "Measurable objectives, such as handling time, accuracy or escalations.",
    ),
    ("expected_outputs", "Expected outputs", "Each output type the system will produce."),
    ("data_inputs", "Data inputs", "Each input, including sensitive data."),
    ("users", "Users", "Who uses the system directly."),
    (
        "vendor",
        "Vendor",
        "Model provider and other third parties. Use Internal if there is no vendor.",
    ),
    ("deployment", "Deployment", "Where it runs and which systems it integrates with."),
    (
        "deployment_geography",
        "Deployment geography",
        "United Kingdom, European Union, France, United States, Singapore, South Korea, or Global.",
    ),
    (
        "autonomy",
        "Autonomy",
        "Whether it recommends, automates a step, or acts on its own.",
    ),
    (
        "human_oversight",
        "Human oversight",
        "Who can override the system, and which decisions stay with a person.",
    ),
    ("technology", "Technology", "Model type, software and third-party services inside the system."),
    (
        "affected_groups",
        "Who is affected",
        "Direct and indirect groups, with a low, medium or high scale for each.",
    ),
    (
        "vulnerable_groups",
        "Vulnerable groups",
        "Groups that may be affected, with a scale. State None if there are none.",
    ),
    (
        "wrong_decision_cost",
        "Cost of a wrong decision",
        "Financial, operational, reputational, regulatory and trust effects.",
    ),
    ("success_metrics", "Success metrics", "KPI targets."),
    (
        "process_owners",
        "Process owners",
        "Who sets objectives, selects data, sets thresholds and makes the final decision.",
    ),
    (
        "foreseeable_use",
        "Foreseeable use",
        "Ways the system could be used beyond the intended purpose.",
    ),
    (
        "prohibited_uses",
        "Prohibited uses",
        "Uses the system must not perform. Leave blank only when an open condition will be recorded.",
    ),
]

SAMPLE: dict[str, str] = {
    "system_name": "Claims helper",
    "identifier": "CLAIMS-HELPER",
    "problem_statement": "Analysts spend too long on first-pass review of claim documents.",
    "goals": (
        "Reduce first-pass handling time by 20 percent and keep a person "
        "on every adverse recommendation."
    ),
    "expected_outputs": (
        "Draft review note; list of missing documents; suggested questions for the analyst."
    ),
    "data_inputs": (
        "Internal claim files; customer correspondence; payment history. "
        "Includes personal and financial data."
    ),
    "users": "Claims analysts in the UK retail claims team.",
    "vendor": "Northwind Models, a hosted language model.",
    "deployment": (
        "Internal web application in the company network. Integrates with the claims "
        "work queue. No customer-facing channel."
    ),
    "deployment_geography": "United Kingdom",
    "autonomy": "Recommends next steps. It cannot decline a claim or send a customer message.",
    "human_oversight": (
        "The analyst reviews every recommendation before it is saved. "
        "Adverse recommendations require a second person."
    ),
    "technology": (
        "Fine-tuned language model behind an internal application, "
        "with retrieval over the claim file store."
    ),
    "affected_groups": (
        "Claims analysts, medium scale. Customers whose files are reviewed, medium scale."
    ),
    "vulnerable_groups": "Customers in financial difficulty, medium scale.",
    "wrong_decision_cost": (
        "Operational delay, unfair customer outcomes, and regulatory complaint risk."
    ),
    "success_metrics": "Handling time down 20 percent, with no rise in upheld complaints.",
    "process_owners": (
        "Model owner Jordan Hale selects training data. The claims committee accepts launch."
    ),
    "foreseeable_use": "Using a recommendation to decline a claim or to message a customer.",
    "prohibited_uses": (
        "Must not decline a claim, send a customer message, or be used outside the UK retail claims team."
    ),
}

INSTRUCTIONS = [
    "GRAIL model-owner intake workbook. Synthetic demonstration data.",
    "The model owner completes the Model owner submission sheet and returns it to the AI governance lead.",
    "The governance lead uploads it on Register AI system, or types each field instead.",
    "Do not enter system assessment or proposed risk tier. The governance lead enters both in GRAIL.",
    "The Governance Intake Agent uses the answers to prepare a normalised record, missing questions and a preliminary materiality recommendation.",
    "That recommendation is for the governance lead. It is not a launch approval.",
]


def main() -> None:
    public = ROOT / "frontend" / "public" / "templates"
    seed = ROOT / "seed" / "demo"
    write_workbook(public / "grail-governance-intake-template.xlsx", {})
    write_workbook(public / "grail-governance-intake-sample.xlsx", SAMPLE)
    write_workbook(seed / "grail-governance-intake-sample.xlsx", SAMPLE)


def write_workbook(path: Path, answers: dict[str, str]) -> None:
    rows = [["field_key", "field_label", "model_owner_answer", "guidance"]]
    rows.extend([key, label, answers.get(key, ""), guidance] for key, label, guidance in FIELDS)
    instructions = [["instruction"], *[[line] for line in INSTRUCTIONS]]
    names = ["Model owner submission", "Instructions"]
    path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(path, "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", _content_types(len(names)))
        archive.writestr(
            "_rels/.rels",
            _rels(
                [
                    (
                        "rId1",
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                        "xl/workbook.xml",
                    )
                ]
            ),
        )
        archive.writestr("xl/workbook.xml", _workbook_xml(names))
        archive.writestr(
            "xl/_rels/workbook.xml.rels",
            _rels(
                [
                    (
                        "rId1",
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet",
                        "worksheets/sheet1.xml",
                    ),
                    (
                        "rId2",
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet",
                        "worksheets/sheet2.xml",
                    ),
                ]
            ),
        )
        archive.writestr("xl/worksheets/sheet1.xml", _sheet(rows))
        archive.writestr("xl/worksheets/sheet2.xml", _sheet(instructions))


def _sheet(rows: list[list[str]]) -> str:
    body: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cells = "".join(
            _cell(f"{chr(65 + column)}{row_index}", value) for column, value in enumerate(row)
        )
        body.append(f'<row r="{row_index}">{cells}</row>')
    last_column = max((len(row) for row in rows), default=1)
    ref = f"A1:{chr(64 + last_column)}{len(rows)}"
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<dimension ref="{ref}"/>'
        f"<sheetData>{''.join(body)}</sheetData>"
        "</worksheet>"
    )


def _cell(ref: str, value: str) -> str:
    text = sax.escape(value)
    return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>'


def _workbook_xml(names: list[str]) -> str:
    sheets = "".join(
        f'<sheet name="{sax.escape(name)}" sheetId="{index}" r:id="rId{index}"/>'
        for index, name in enumerate(names, start=1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f"<sheets>{sheets}</sheets></workbook>"
    )


def _content_types(sheet_count: int) -> str:
    overrides = "".join(
        "<Override "
        f'PartName="/xl/worksheets/sheet{index}.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for index in range(1, sheet_count + 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" '
        'ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        f"{overrides}</Types>"
    )


def _rels(items: list[tuple[str, str, str]]) -> str:
    body = "".join(
        f'<Relationship Id="{rid}" Type="{kind}" Target="{target}"/>'
        for rid, kind, target in items
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f"{body}</Relationships>"
    )


if __name__ == "__main__":
    main()
