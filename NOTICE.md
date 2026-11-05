# Third-party data and licenses

GondolatHid builds **dictionary and frequency data** from external sources (`npm run build:words`).  
For the **application source code** license, see [LICENSE](./LICENSE) in the repository root.

---

## FrequencyWords (Hungarian + Romanian frequency lists)

- **Source:** [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)  
- **Files:** `content/2016/hu/hu_full.txt`, `content/2016/ro/ro_full.txt`  
- **License (word list content):** [Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)  
- **License (generator code):** MIT (in that repository; this project only **downloads the lists**)

**Required attribution (CC BY-SA):**  
The raw frequency lists are © FrequencyWords / David J. Nemeth (and contributors), CC BY-SA 4.0.  
Generated `bootstrap.tsv` / `stats.json` in this project are **derivative** data (filtering, formatting, top-N cutoff; Hunspell-only forms with freq 0 are in a separate file).

**Original corpus (OpenSubtitles):**  
FrequencyWords 2016 lists are derived from the [OpenSubtitles2016](http://opus.lingfil.uu.se/OpenSubtitles2016.php) corpus (see the FrequencyWords README).

**May you use it?** Yes, **at no charge**, if you:

1. **Credit the source** (links above + CC BY-SA 4.0).
2. **Share derivative lists** you redistribute (e.g. published `bootstrap.tsv`) under the **same license** (ShareAlike) and indicate that you modified them.

If you only deploy the **web app** (e.g. GitHub Pages) and CI generates the data at build time, keep this NOTICE in the repo and link to it from the public site or README.

---

## Hunspell / LibreOffice (supplemental spellings)

| Language | Dictionary |
|----------|------------|
| Hungarian | [LibreOffice/dictionaries – hu_HU](https://github.com/LibreOffice/dictionaries/tree/master/hu_HU) |
| Romanian | [LibreOffice/dictionaries – ro](https://github.com/LibreOffice/dictionaries/tree/master/ro) |

`supplement.txt` is built from these; words are stored with **freq = 0** (suggestions only, not letter statistics).  
License: per dictionary in the source repo (typically **LGPL-2.1** / **GPL-3.0** / **MPL-1.1** — see the [dictionaries README](https://github.com/LibreOffice/dictionaries/blob/master/README.md)).

---

## Short attribution (e.g. for README)

> Word frequency data derived from [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles-based lists), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).  
> Supplemental word forms from [LibreOffice Hunspell dictionaries](https://github.com/LibreOffice/dictionaries).
