alter table public.profiles
  drop constraint if exists profiles_available_equipment_check;

alter table public.profiles
  add constraint profiles_available_equipment_check
    check (
      cardinality(available_equipment) between 1 and 10
      and available_equipment <@ array[
        'full_gym', 'barbell', 'dumbbell', 'cable', 'machine',
        'bodyweight', 'kettlebell', 'band', 'cardio', 'functional'
      ]::text[]
    );

with athletic_exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral
) as (
  values
    ('Barbell Snatch','Full Body','Barbell',array['snatch']::text[],array['Hamstrings','Glutes','Back','Shoulders']::text[],'hinge','Accelerate the bar from the floor and receive it overhead in a stable squat.',false),
    ('Power Snatch','Full Body','Barbell',array[]::text[],array['Hamstrings','Glutes','Shoulders']::text[],'hinge','Receive the bar above parallel with locked elbows and balanced feet.',false),
    ('Hang Snatch','Full Body','Barbell',array[]::text[],array['Hamstrings','Glutes','Shoulders']::text[],'hinge','Start from the hang, extend vertically, and receive overhead.',false),
    ('High-Hang Snatch','Full Body','Barbell',array['hip snatch']::text[],array['Glutes','Shoulders']::text[],'hinge','Begin tall at the upper thigh and emphasize fast extension under the bar.',false),
    ('Muscle Snatch','Shoulders','Barbell',array[]::text[],array['Back','Triceps']::text[],'vertical_push','Pull and press the bar overhead without rebending the knees.',false),
    ('Snatch Pull','Full Body','Barbell',array[]::text[],array['Hamstrings','Glutes','Back']::text[],'hinge','Match the snatch start and extend powerfully without receiving the bar.',false),
    ('Snatch Deadlift','Hamstrings','Barbell',array[]::text[],array['Glutes','Back']::text[],'hinge','Use the snatch grip and preserve the first-pull positions.',false),
    ('Snatch Balance','Full Body','Barbell',array[]::text[],array['Shoulders','Quadriceps']::text[],'squat','Drive under the bar quickly and stabilize in an overhead squat.',false),
    ('Barbell Clean','Full Body','Barbell',array['clean']::text[],array['Hamstrings','Glutes','Back','Quadriceps']::text[],'hinge','Extend vertically and receive the bar securely in the front rack.',false),
    ('Power Clean','Full Body','Barbell',array[]::text[],array['Hamstrings','Glutes','Back']::text[],'hinge','Receive the clean above parallel with fast elbows.',false),
    ('Hang Clean','Full Body','Barbell',array[]::text[],array['Hamstrings','Glutes','Back']::text[],'hinge','Start from the hang and meet the bar in a stable front rack.',false),
    ('High-Hang Clean','Full Body','Barbell',array['hip clean']::text[],array['Glutes','Quadriceps']::text[],'hinge','Begin tall and emphasize rapid extension and turnover.',false),
    ('Tall Clean','Full Body','Barbell',array[]::text[],array['Quadriceps','Back']::text[],'other','Pull under the bar from a tall position without a leg drive.',false),
    ('Clean Pull','Full Body','Barbell',array[]::text[],array['Hamstrings','Glutes','Back']::text[],'hinge','Use clean positions and finish with full vertical extension.',false),
    ('Clean Deadlift','Hamstrings','Barbell',array[]::text[],array['Glutes','Back']::text[],'hinge','Reinforce the clean first pull with controlled positioning.',false),
    ('Clean and Jerk','Full Body','Barbell',array['clean & jerk']::text[],array['Quadriceps','Glutes','Shoulders','Triceps']::text[],'other','Clean to the shoulders, recover, then drive the bar overhead.',false),
    ('Split Jerk','Full Body','Barbell',array[]::text[],array['Shoulders','Triceps','Legs']::text[],'vertical_push','Dip vertically, drive, and receive the bar in a balanced split.',false),
    ('Push Jerk','Full Body','Barbell',array[]::text[],array['Shoulders','Triceps','Quadriceps']::text[],'vertical_push','Drive with the legs and rebend to receive overhead.',false),
    ('Power Jerk','Full Body','Barbell',array[]::text[],array['Shoulders','Triceps','Quadriceps']::text[],'vertical_push','Receive the jerk with the feet in a shallow squat stance.',false),
    ('Jerk Dip','Quadriceps','Barbell',array[]::text[],array['Core']::text[],'squat','Maintain an upright torso through a short controlled dip.',false),
    ('Jerk Drive','Full Body','Barbell',array[]::text[],array['Quadriceps','Shoulders']::text[],'vertical_push','Dip and drive vertically without receiving the bar overhead.',false),
    ('Dumbbell Snatch','Full Body','Dumbbell',array['single arm dumbbell snatch']::text[],array['Glutes','Hamstrings','Shoulders']::text[],'hinge','Drive the dumbbell from the floor to overhead in one motion.',true),
    ('Dumbbell Clean and Jerk','Full Body','Dumbbell',array[]::text[],array['Legs','Shoulders','Triceps']::text[],'other','Clean the dumbbell to the shoulder, then drive it overhead.',true),
    ('Kettlebell Clean','Full Body','Kettlebell',array[]::text[],array['Glutes','Hamstrings','Shoulders']::text[],'hinge','Guide the bell around the wrist into a quiet rack position.',true),
    ('Kettlebell Snatch','Full Body','Kettlebell',array[]::text[],array['Glutes','Hamstrings','Shoulders']::text[],'hinge','Drive the bell overhead and finish without striking the forearm.',true),
    ('Kettlebell Clean and Jerk','Full Body','Kettlebell',array[]::text[],array['Legs','Shoulders','Triceps']::text[],'other','Clean to the rack, then use the legs to drive overhead.',true),
    ('Barbell Thruster','Full Body','Barbell',array['thruster']::text[],array['Quadriceps','Glutes','Shoulders','Triceps']::text[],'vertical_push','Flow from the front squat into an overhead press.',false),
    ('Dumbbell Thruster','Full Body','Dumbbell',array[]::text[],array['Quadriceps','Glutes','Shoulders']::text[],'vertical_push','Stand from the squat and transfer momentum into the press.',false),
    ('Wall Ball Shot','Full Body','Medicine Ball',array['wall ball']::text[],array['Quadriceps','Glutes','Shoulders']::text[],'conditioning','Squat with the ball at the chest and throw to a consistent target.',false),
    ('Burpee','Full Body','Bodyweight',array[]::text[],array['Chest','Core','Legs']::text[],'conditioning','Move from standing to the floor and back with controlled rhythm.',false),
    ('Burpee Box Jump-Over','Full Body','Plyo Box',array[]::text[],array['Legs','Chest','Core']::text[],'conditioning','Complete a burpee, then clear the box safely and under control.',false),
    ('Box Jump','Legs','Plyo Box',array[]::text[],array['Glutes','Calves']::text[],'conditioning','Jump to a stable landing and step down under control.',false),
    ('Box Step-Over','Legs','Plyo Box',array[]::text[],array['Glutes','Quadriceps']::text[],'lunge','Step over the box with control and alternate the lead leg.',true),
    ('Double-Under','Cardio','Jump Rope',array['double under']::text[],array['Calves','Shoulders']::text[],'conditioning','Pass the rope twice per jump while maintaining relaxed rhythm.',false),
    ('Single-Under','Cardio','Jump Rope',array['jump rope']::text[],array['Calves','Shoulders']::text[],'conditioning','Keep a steady bounce and turn the rope primarily with the wrists.',false),
    ('Battle Rope Waves','Full Body','Battle Rope',array[]::text[],array['Shoulders','Core']::text[],'conditioning','Maintain an athletic stance and create consistent alternating waves.',false),
    ('Rope Climb','Full Body','Climbing Rope',array[]::text[],array['Back','Biceps','Grip','Core']::text[],'vertical_pull','Use a secure foot lock and controlled hand-over-hand progress.',false),
    ('Toes-to-Bar','Core','Pull-Up Rig',array['toes to bar']::text[],array['Lats','Grip']::text[],'other','Control the swing and bring the feet to the bar without losing tension.',false),
    ('Knees-to-Elbows','Core','Pull-Up Rig',array[]::text[],array['Lats','Grip']::text[],'other','Use a controlled hang and draw the knees toward the elbows.',false),
    ('Bar Muscle-Up','Full Body','Pull-Up Rig',array[]::text[],array['Back','Chest','Triceps','Core']::text[],'vertical_pull','Pull high, transition over the bar, and finish with locked arms.',false),
    ('Ring Muscle-Up','Full Body','Gymnastic Rings',array[]::text[],array['Back','Chest','Triceps','Core']::text[],'vertical_pull','Use a controlled pull, stable transition, and supported finish.',false),
    ('Kipping Pull-Up','Back','Pull-Up Rig',array[]::text[],array['Biceps','Core']::text[],'vertical_pull','Create a controlled hollow-to-arch rhythm before pulling.',false),
    ('Handstand Push-Up','Shoulders','Bodyweight',array['HSPU']::text[],array['Triceps','Core']::text[],'vertical_push','Use a stable hand position and controlled range appropriate to skill.',false),
    ('Handstand Walk','Full Body','Bodyweight',array[]::text[],array['Shoulders','Core']::text[],'carry','Maintain stacked shoulders and take small controlled hand steps.',false),
    ('Bear Crawl','Full Body','Bodyweight',array[]::text[],array['Core','Shoulders','Legs']::text[],'carry','Keep the knees low and move opposite hand and foot together.',false),
    ('Sandbag Clean','Full Body','Sandbag',array[]::text[],array['Glutes','Hamstrings','Back']::text[],'hinge','Brace, extend the hips, and guide the bag to a secure front position.',false),
    ('Sandbag Bear-Hug Carry','Full Body','Sandbag',array[]::text[],array['Core','Back','Legs']::text[],'carry','Hold the bag high and walk with a braced torso.',false),
    ('Sandbag to Shoulder','Full Body','Sandbag',array[]::text[],array['Glutes','Back','Shoulders']::text[],'hinge','Extend through the hips and guide the bag onto one shoulder.',true),
    ('Devil Press','Full Body','Dumbbell',array[]::text[],array['Chest','Glutes','Shoulders']::text[],'conditioning','Combine a dumbbell burpee with a controlled double-dumbbell snatch.',false),
    ('Tire Flip','Full Body','Tire',array[]::text[],array['Glutes','Quadriceps','Back']::text[],'conditioning','Drive through the tire with the legs and reposition the hands safely.',false),
    ('Broad Jump','Legs','Bodyweight',array['standing long jump']::text[],array['Glutes','Hamstrings','Calves']::text[],'conditioning','Project forward and land softly with balanced knees and hips.',false),
    ('Depth Jump','Legs','Plyo Box',array[]::text[],array['Glutes','Calves']::text[],'conditioning','Step from the box and rebound only if landing mechanics are stable.',false),
    ('Lateral Bound','Legs','Bodyweight',array['skater jump']::text[],array['Glutes','Adductors']::text[],'lunge','Bound sideways and own the single-leg landing.',true),
    ('Pogo Jump','Calves','Bodyweight',array[]::text[],array['Feet']::text[],'conditioning','Use quick elastic ankle contacts with minimal knee bend.',false),
    ('Medicine Ball Chest Pass','Full Body','Medicine Ball',array[]::text[],array['Chest','Triceps']::text[],'horizontal_push','Throw explosively from the chest and reset with control.',false),
    ('Rotational Medicine Ball Throw','Full Body','Medicine Ball',array[]::text[],array['Obliques','Glutes']::text[],'rotation','Rotate through the hips and release the ball into a safe target.',true),
    ('Air Bike','Cardio','Cardio Air Bike',array['assault bike','echo bike']::text[],array['Legs','Arms']::text[],'conditioning','Use coordinated pushing, pulling, and pedaling at the intended effort.',false),
    ('SkiErg','Cardio','Cardio SkiErg',array['ski erg']::text[],array['Lats','Core','Triceps']::text[],'conditioning','Drive the handles down with the trunk and arms, then recover smoothly.',false),
    ('Treadmill Run','Cardio','Cardio Treadmill',array[]::text[],array['Legs']::text[],'conditioning','Use a sustainable stride and match speed to the planned effort.',false),
    ('Treadmill Walk','Cardio','Cardio Treadmill',array[]::text[],array['Legs']::text[],'conditioning','Walk with stable posture at the planned speed and incline.',false),
    ('Incline Treadmill Walk','Cardio','Cardio Treadmill',array[]::text[],array['Glutes','Calves']::text[],'conditioning','Keep an upright posture and avoid relying on the handrails.',false),
    ('Elliptical Trainer','Cardio','Cardio Elliptical',array['elliptical']::text[],array['Legs']::text[],'conditioning','Maintain smooth continuous pressure through the full stride.',false),
    ('Stair Climber','Cardio','Cardio Stair Machine',array['stairmill']::text[],array['Quadriceps','Glutes','Calves']::text[],'conditioning','Use complete steps and minimize support from the rails.',false),
    ('Outdoor Run','Cardio','Bodyweight',array['running']::text[],array['Legs']::text[],'conditioning','Choose terrain and effort appropriate to the planned session.',false),
    ('Outdoor Walk','Cardio','Bodyweight',array['walking']::text[],array['Legs']::text[],'conditioning','Walk at the intended duration, distance, or effort.',false),
    ('Outdoor Cycling','Cardio','Cardio Bike',array['cycling']::text[],array['Quadriceps','Glutes']::text[],'conditioning','Use a safe route and sustain the planned effort.',false),
    ('Lap Swimming','Cardio','Cardio Pool',array['swimming']::text[],array['Shoulders','Back','Core']::text[],'conditioning','Use a repeatable stroke and track distance or duration.',false),
    ('Hiking','Cardio','Bodyweight',array[]::text[],array['Legs','Core']::text[],'conditioning','Select terrain and load appropriate to current capacity.',false)
)
insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral, owner_id
)
select
  v.name, v.muscle_group, v.equipment, v.aliases, v.secondary_muscles,
  v.movement_pattern, v.instructions, v.is_unilateral, null
from athletic_exercises v
where not exists (
  select 1 from public.exercises e
  where e.owner_id is null and lower(e.name) = lower(v.name)
);
