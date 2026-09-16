# Free exercise data & demo-media sources: licence audit (10 Sep 2026)

| Source | Content | Licence (verified) | Redistribute in public repo? | Commercial | Attribution |
|---|---|---|---|---|---|
| free-exercise-db (yuhonas) | 876 exercises JSON; 873 have 2 JPEGs (850x567) | Repo: Unlicense, but images are scraped (bodybuilding.com / ExRx), not owned | JSON text: probably; images: NO | JSON only | none |
| wger | 949 exercises, 3,371 translations/30 langs, 377 images, 78 videos | Data CC-BY-SA 3.0/4.0 per item; code AGPL-3 | Yes (share-alike) | Yes | per-item license_author |
| ExerciseDB | 1,394 exercises + GIF each | Paid ($199/$599), proprietary; raw-file redistribution banned | No | inside your app only | — |
| everkinetic/data | 293 exercises JSON + ~270 SVG/PNG start/end pairs (948x860) | CC-BY-SA 4.0 (LICENSE.md verified locally) | Yes | Yes | Greg Priday / everkinetic |
| MuscleWiki | 2,000+ videos | Proprietary API terms: no offline storage, no scraping | No | paid API only | required |
| Mixamo | ~2,000 anims incl. Air Squat, Push Up, Burpee, Jumping Jacks, Plank, Sit Up | Adobe General Terms 3.6: no stand-alone distribution of content files | Grey -> No | yes in End Use | none |
| Lottie free assets | decorative workout loops | Lottie Simple License, no standalone redistribution | Grey | Yes | none |
| CMU MoCap (+cgspeed BVH) | ~10 exercise clips (jacks, squats, lunges, stretch, jog); NO push-ups/sit-ups/planks/burpees | "free for all uses", no direct resale; ack text requested | Yes | Yes | ack text |
| Fit3D | 47 exercises, 3D skeletons | non-commercial, no redistribution | No | No | — |
| MM-Fit | 10 exercises, pose estimates | pose zip licence unstated | unclear | unclear | cite paper |
| YouTube embed | any public video | Developer Policies: no caching/offline | online only | Yes | branding rules |

Sources: https://github.com/yuhonas/free-exercise-db/issues/2 ; https://github.com/wrkout/exercises.json/blob/master/CONTRIBUTING.md ; https://wger.readthedocs.io/en/latest/#licence ; https://exercisedb.io/terms ; https://github.com/everkinetic/data ; https://api.musclewiki.com/api-terms ; https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html ; https://www.adobe.com/legal/terms.html ; https://help.lottiefiles.com/animation-licensing-basics- ; http://mocap.cs.cmu.edu/ ; https://fit3d.imar.ro/legal ; https://mmfit.github.io/ ; https://developers.google.com/youtube/terms/developer-policies

## everkinetic coverage (checked locally, 293 entries)
primary: biceps 56, triceps 49, chest 43, quadriceps 36, shoulders 29, abdominals 14, calves 14, lats 9, lower back 8, hamstrings 9, middle back 4, trapezius 3, glutes 3, misc.
HAS: Barbell Squat, Bench Press (many), Pull Ups, Seated Cable Rows, Wide Grip Lat Pull Down, Leg Press, Lunges (several), Romanian Dead Lift, Shoulder Press (several), Push Ups, Crunches, Calf Raises, Dips, Side Plank, Leg Curls.
MISSING: conventional Deadlift, Hip Thrust, Glute Bridge, front Plank, Face Pull, Bird Dog, Burpee, Jumping Jacks, all cardio.

## Recommendation
(a) Library: wger as the spine + everkinetic (both CC-BY-SA; publish merged JSON as CC-BY-SA 4.0 with CREDITS). free-exercise-db text only for gaps, never its images.
(b) Demo: everkinetic two-pose crossfade where available; hand-authored SVG stick-figure keyframe animations (own licence) for the missing core lifts and cardio moves; CMU BVH can seed joint angles for jacks/squats/lunges. Skip Mixamo, MuscleWiki, ExerciseDB, Fit3D. YouTube only as optional online link-out.
