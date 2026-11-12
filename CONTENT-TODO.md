# Content still needed

The site uses only facts from the 9/28/2026 résumé, the previous site and the project reports. Nothing below has been invented. These are the gaps, and the claims worth a second look.

## Missing material

**SDSU research (Lingping Kong Research Group)**
- A formal position title. The résumé only says "Undergraduate Research in Advanced Energy Systems: Electrochemical Energy Lab, Dr. Lingping Kong", so the page uses that wording as the role line.
- The start date. The entry shows "Current" and sorts last among current roles until a date is added (`start` in `src/data/experience.json`).
- Everything in the research record: experimental procedures, material-recovery workflows, characterization methods, equipment and lab processes, images, findings and results, publications, posters or presentations. The page lists each as "Not yet published".
- Permission to use any photographs from the lab website. None were used.


**All case studies**
- Lessons learned. None of the source material states any, so no "lessons" section is published. The case-study template takes one more `case-sec` whenever you have it.

**Aztec Electric Racing** (the page has a documentation index with empty rows)
- Leadership and operations: the operations framework itself (structure, documents), how work was delegated.
- Budget and funding: sources behind the $200K+ figure, sponsorship outreach, budget planning for a 250+ member team.
- Documentation and validation standards: an example page or template to show.
- Vehicle development beyond the accumulator and testbench.
- Organizational impact: what changed for the team during these roles.
- Photos and results from competition, if any.

**Powertrain testbench** (text only today)
- Photos of the testbench, wiring diagrams, pedal-box CAD, inverter calibration records, test results, and what was learned.

**Tractive accumulator**
- Testing and troubleshooting after assembly (charge and discharge tests, issues found and fixed). The report covers design and fabrication; the page says what was verified and nothing more.
- Date or event of the structural inspection pass.

**Tesla-powered Triumph Stag**
- Commissioning results: first drive, measured performance, current status. The page says the project is active and makes no performance claim.
- Photos of the finished car, and any mechanical fabrication you did.

**IAM3D drone**
- Flight-test results, competition photos, team size, and what you personally owned beyond project management.

**SpaceX, NASA, Muslim Tech Collaborative**
- Anything you can share publicly (SpaceX work is confidential, so only non-sensitive outcomes). NASA: screenshots or examples of the document-control tools. MTC: events, photos, partner employers you're allowed to name.
- The NASA tools project was listed on the old Projects page without a case study. It is not on the new Work page; add it to `projects.json` if you write it up.

## Please confirm

- **Dean's List.** The earlier résumé listed "5× Dean's List Honoree"; the 9/28/2026 résumé does not, so it is no longer on the site. Say the word if you want it back.
- **The Thermal Club** is now described as "contract" (it was "part-time") to match the new résumé.
- **Skills** now follow the new résumé. "AI agent tooling", "Microsoft Office" and "PCB design" are gone from it; "DFM", "wiring-harness design" and "automotive/EV systems integration" are in.
- **Languages and education start date (Aug 2022)** are not on the new résumé. They stay from the earlier site; delete them if you'd rather the site match the résumé exactly.

- **"$200K+ funding and support secured"** appears on the previous site but not on the résumé.
- **ASME · SDSU Project Manager (Aug 2023 – May 2024)** appears on the previous site but not on the résumé.
- **Aztec dates.** The résumé lists President | Energy Storage Team Lead as 07/2023 to 06/2026 (three years). You described the energy-storage lead role as about two years. The site uses the résumé dates.
- **"3 teams adopted the review process"** is derived from the résumé line "adopted by supplier development, quality, and design engineering teams".
- **Stag cooling and commissioning paragraphs** carried over from the previous page. They read as general engineering practice (hose support, bend radius, air traps, commissioning order). Keep them only if they describe what you actually did.
- **Phone number** is on the résumé PDF but nowhere on the site.

## Optional

- Fonts are system fonts for speed and zero downloads. If you want a specific typeface, self-host it in `assets/fonts/` and set `--f-display` / `--f-sans` in `site.css`.
