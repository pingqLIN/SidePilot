import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
EXT_DIR = ROOT / "extension-sidecar-converter-mvp"
TMP_DIR = Path("C:/Dev/_tmp")
REPORT_PATH = TMP_DIR / "sidecar-converter-mvp-e2e-report.json"
SCREENSHOT_PATH = TMP_DIR / "sidecar-converter-mvp-e2e.png"
SAMPLE_URL = "https://chromewebstore.google.com/detail/uBlock-Origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"


def read_permissions():
    manifest = json.loads((EXT_DIR / "manifest.json").read_text(encoding="utf-8"))
    return {
        "permissions": manifest.get("permissions", []),
        "host_permissions": manifest.get("host_permissions", []),
    }


def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    user_data_dir = tempfile.mkdtemp(prefix="sidecar-converter-mvp-")
    try:
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                user_data_dir=user_data_dir,
                headless=False,
                args=[
                    f"--disable-extensions-except={EXT_DIR}",
                    f"--load-extension={EXT_DIR}",
                ],
            )

            if not context.service_workers:
                context.wait_for_event("serviceworker", timeout=20000)
            if not context.service_workers:
                raise RuntimeError("Extension service worker did not start.")

            worker = context.service_workers[0]
            extension_id = worker.url.split("/")[2]

            page = context.new_page()
            page.goto(f"chrome-extension://{extension_id}/sidepanel.html")
            page.wait_for_load_state("domcontentloaded")

            before_saved = int(page.locator("#savedCount").inner_text())

            # Simulate drag/drop link directly into the drop zone.
            page.evaluate(
                """
                (url) => {
                  const zone = document.getElementById("dropZone");
                  const dt = new DataTransfer();
                  dt.setData("text/plain", url);
                  zone.dispatchEvent(new DragEvent("drop", {
                    dataTransfer: dt,
                    bubbles: true,
                    cancelable: true
                  }));
                }
                """,
                SAMPLE_URL,
            )

            page.wait_for_function(
                "document.getElementById('analysisResult').dataset.ready === '1'",
                timeout=15000,
            )

            analysis = page.evaluate("window.__MVP_TEST_HOOKS__.getState().currentAnalysis")
            if not analysis:
                raise RuntimeError("Analysis result missing.")
            if analysis["source"]["extensionId"] != "cjpalhdlnbpafiamejdnhcphjbkeiagm":
                raise RuntimeError("Parsed extensionId mismatch.")
            if "clients2.google.com/service/update2/crx" not in analysis["download"]["originalCrxUrl"]:
                raise RuntimeError("CRX original download URL not generated.")

            page.click("#saveBtn")
            page.wait_for_timeout(300)
            after_saved = int(page.locator("#savedCount").inner_text())
            if after_saved < before_saved + 1:
                raise RuntimeError("Save record did not increment saved count.")

            page.click("#convertBtn")
            page.wait_for_timeout(300)
            converted = page.evaluate("window.__MVP_TEST_HOOKS__.getState().currentConverted")
            if not converted:
                raise RuntimeError("Converted data missing.")
            if converted.get("schema") != "sidecar.converter.v0":
                raise RuntimeError("Converted schema mismatch.")

            page.screenshot(path=str(SCREENSHOT_PATH), full_page=True)

            report = {
                "status": "PASS",
                "tested_at": datetime.now(timezone.utc).isoformat(),
                "extension_dir": str(EXT_DIR),
                "extension_id": extension_id,
                "sample_url": SAMPLE_URL,
                "saved_count_before": before_saved,
                "saved_count_after": after_saved,
                "analysis_record_id": analysis["recordId"],
                "permissions": read_permissions(),
                "screenshot": str(SCREENSHOT_PATH),
            }
            REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps(report, ensure_ascii=False, indent=2))
            context.close()
    finally:
        shutil.rmtree(user_data_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
