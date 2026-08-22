alter table public.profiles
  add column if not exists available_equipment text[] not null
    default array['full_gym']::text[];

alter table public.profiles
  add constraint profiles_available_equipment_check
    check (
      cardinality(available_equipment) between 1 and 9
      and available_equipment <@ array[
        'full_gym', 'barbell', 'dumbbell', 'cable', 'machine',
        'bodyweight', 'kettlebell', 'band', 'cardio'
      ]::text[]
    );

with expanded_exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral
) as (
  values
    ('Front Squat', 'Quadriceps', 'Barbell', array['front barbell squat'], array['Glutes','Core'], 'squat', 'Keep the elbows high and sit between the hips.', false),
    ('Goblet Squat', 'Quadriceps', 'Dumbbell', array['dumbbell goblet squat'], array['Glutes','Core'], 'squat', 'Hold the load close to the chest and keep the whole foot planted.', false),
    ('Hack Squat', 'Quadriceps', 'Machine', array['machine hack squat'], array['Glutes'], 'squat', 'Control the descent and keep the knees tracking with the toes.', false),
    ('Belt Squat', 'Quadriceps', 'Machine', array[]::text[], array['Glutes'], 'squat', 'Brace the torso and drive through the whole foot.', false),
    ('Bulgarian Split Squat', 'Quadriceps', 'Dumbbell', array['rear foot elevated split squat'], array['Glutes','Hamstrings'], 'lunge', 'Use a stable rear-foot support and control the bottom position.', true),
    ('Dumbbell Step-Up', 'Glutes', 'Dumbbell', array['step up'], array['Quadriceps'], 'lunge', 'Drive through the working leg without pushing off the trailing foot.', true),
    ('Romanian Deadlift', 'Hamstrings', 'Barbell', array['RDL'], array['Glutes','Back'], 'hinge', 'Push the hips back while keeping the load close to the legs.', false),
    ('Dumbbell Romanian Deadlift', 'Hamstrings', 'Dumbbell', array['dumbbell RDL'], array['Glutes','Back'], 'hinge', 'Hinge at the hips and stop when hamstring tension limits range.', false),
    ('Sumo Deadlift', 'Glutes', 'Barbell', array[]::text[], array['Hamstrings','Back'], 'hinge', 'Set a stable wide stance and push the floor away.', false),
    ('Barbell Hip Thrust', 'Glutes', 'Barbell', array['hip thrust'], array['Hamstrings'], 'hinge', 'Finish with the ribs down and full hip extension.', false),
    ('45-Degree Back Extension', 'Hamstrings', 'Machine', array['back extension'], array['Glutes','Back'], 'hinge', 'Move through the hips and avoid overextending the lower back.', false),
    ('Cable Pull-Through', 'Glutes', 'Cable', array[]::text[], array['Hamstrings'], 'hinge', 'Reach the hips back, then stand tall by squeezing the glutes.', false),
    ('Incline Dumbbell Bench Press', 'Chest', 'Dumbbell', array['incline dumbbell press'], array['Shoulders','Triceps'], 'horizontal_push', 'Keep the shoulder blades set and lower with control.', false),
    ('Machine Chest Press', 'Chest', 'Machine', array[]::text[], array['Shoulders','Triceps'], 'horizontal_push', 'Adjust the seat so the handles align with the mid chest.', false),
    ('Cable Chest Fly', 'Chest', 'Cable', array['cable fly'], array['Shoulders'], 'horizontal_push', 'Keep a soft elbow bend and bring the arms together under control.', false),
    ('Push-Up', 'Chest', 'Bodyweight', array['pushup'], array['Shoulders','Triceps','Core'], 'horizontal_push', 'Maintain a straight body line and lower the chest between the hands.', false),
    ('Landmine Press', 'Shoulders', 'Barbell', array[]::text[], array['Chest','Triceps'], 'vertical_push', 'Press up and forward while keeping the ribs stacked.', true),
    ('Arnold Press', 'Shoulders', 'Dumbbell', array[]::text[], array['Triceps'], 'vertical_push', 'Rotate smoothly and avoid forcing range at the shoulder.', false),
    ('Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell', array['lateral raise'], array[]::text[], 'isolation', 'Raise with control and keep the shoulders away from the ears.', false),
    ('Chest-Supported Dumbbell Row', 'Back', 'Dumbbell', array['chest supported row'], array['Biceps'], 'horizontal_pull', 'Keep the chest supported and pull the elbows toward the hips.', false),
    ('Seated Cable Row', 'Back', 'Cable', array['cable row'], array['Biceps'], 'horizontal_pull', 'Stay tall and finish the pull without excessive torso swing.', false),
    ('One-Arm Dumbbell Row', 'Back', 'Dumbbell', array['single arm dumbbell row'], array['Biceps'], 'horizontal_pull', 'Brace firmly and pull toward the back pocket.', true),
    ('Inverted Row', 'Back', 'Bodyweight', array['bodyweight row'], array['Biceps','Core'], 'horizontal_pull', 'Keep a rigid body line and pull the chest toward the bar.', false),
    ('Neutral-Grip Lat Pulldown', 'Back', 'Cable', array['neutral pulldown'], array['Biceps'], 'vertical_pull', 'Pull the elbows down without leaning excessively.', false),
    ('Assisted Pull-Up', 'Back', 'Machine', array['assisted chin up'], array['Biceps'], 'vertical_pull', 'Use only enough assistance to complete controlled repetitions.', false),
    ('Straight-Arm Pulldown', 'Back', 'Cable', array[]::text[], array['Core'], 'vertical_pull', 'Keep the arms nearly straight and pull from the shoulders.', false),
    ('Seated Leg Curl', 'Hamstrings', 'Machine', array['hamstring curl'], array[]::text[], 'isolation', 'Align the knee with the machine pivot and control both directions.', false),
    ('Leg Extension', 'Quadriceps', 'Machine', array[]::text[], array[]::text[], 'isolation', 'Use a controlled range and avoid kicking the weight.', false),
    ('Standing Calf Raise', 'Calves', 'Machine', array['calf raise'], array[]::text[], 'isolation', 'Pause in the stretched and shortened positions.', false),
    ('Face Pull', 'Shoulders', 'Cable', array[]::text[], array['Upper Back'], 'horizontal_pull', 'Pull toward the face while rotating the hands apart.', false),
    ('Incline Dumbbell Curl', 'Biceps', 'Dumbbell', array[]::text[], array['Forearms'], 'isolation', 'Keep the upper arm still and use a full comfortable range.', false),
    ('Cable Triceps Pressdown', 'Triceps', 'Cable', array['triceps pushdown'], array[]::text[], 'isolation', 'Keep the elbows pinned and extend without shoulder movement.', false),
    ('Pallof Press', 'Core', 'Cable', array['anti rotation press'], array[]::text[], 'rotation', 'Resist rotation as the hands press away from the torso.', true),
    ('Farmer Carry', 'Full Body', 'Dumbbell', array['farmers walk'], array['Grip','Core','Traps'], 'carry', 'Walk tall with controlled steps and steady breathing.', false),
    ('Kettlebell Swing', 'Glutes', 'Kettlebell', array[]::text[], array['Hamstrings','Core'], 'hinge', 'Use a powerful hip hinge; the arms guide rather than lift.', false),
    ('Band Pull-Apart', 'Upper Back', 'Band', array[]::text[], array['Shoulders'], 'horizontal_pull', 'Keep the ribs down and spread the band under control.', false),
    ('Sled Push', 'Full Body', 'Sled Machine', array['prowler push'], array['Quadriceps','Glutes'], 'conditioning', 'Use short forceful steps while maintaining a braced torso.', false),
    ('Stationary Bike', 'Cardio', 'Cardio Bike', array['exercise bike'], array['Quadriceps'], 'conditioning', 'Adjust the seat for a comfortable pedal stroke.', false),
    ('Rowing Ergometer', 'Cardio', 'Cardio Rower', array['rowing machine','erg row'], array['Back','Legs'], 'conditioning', 'Drive with the legs, then finish with the torso and arms.', false)
)
insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral, owner_id
)
select
  v.name, v.muscle_group, v.equipment, v.aliases, v.secondary_muscles,
  v.movement_pattern, v.instructions, v.is_unilateral, null
from expanded_exercises v
where not exists (
  select 1
  from public.exercises e
  where e.owner_id is null
    and lower(e.name) = lower(v.name)
);
