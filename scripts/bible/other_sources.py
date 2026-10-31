"""Whole Bibles that eBible does not offer, from three other open collections (added 2026-10-31).

Each reaches the build as plain USFM written by scripts/convert-other-bibles.py into sources/converted/<id>/, beside
its untouched download, so the build's converter and checks treat them exactly like the eBible texts.
"""

HELLOAO = "https://bible.helloao.org/api/{}/complete.json"
OPEN_BIBLES = "https://raw.githubusercontent.com/seven1m/open-bibles/master/{}"
CROSSWIRE = "https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/{}.zip"

# id: (format, download URL). The download's file name is the URL's last part.
OTHER_SOURCES = {
    **{tid: ("helloao", HELLOAO.format(tid)) for tid in (
        "ach_abr", "bis_obb", "hrv_hrsdc", "cab_sblg", "drs_wft", "ibb_bib", "kfx_osj", "lao_bib", "mam_ost", "mhr_mmu",
        "nme_nz", "nyn_bsu", "poh_pok", "run_bib", "czt_zb")},
    **{name.split(".")[0]: ("osis", OPEN_BIBLES.format(name)) for name in (
        "sqi-albanian.osis.xml", "hun-karoli.osis.xml", "ron-rccv.usfx.xml")},
    **{name: ("sword", CROSSWIRE.format(name)) for name in ("GreVamvas", "Mg1865", "FinBiblia", "Norsk", "Swe1917", "LvGluck8")},
}
