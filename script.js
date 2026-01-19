// ========================
// USER AUTHENTICATION & DATA MANAGEMENT
// ========================

let currentUser = null;
let users = JSON.parse(localStorage.getItem('fitnessUsers')) || {};

// DOM Elements
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Authentication Event Listeners
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);
logoutBtn.addEventListener('click', logout);
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Login Function
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please enter both username and password!');
        return;
    }

    if (users[username] && users[username].password === password) {
        currentUser = username;
        loadUserData();
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        document.getElementById('usernameDisplay').textContent = username;
        showAchievementPopup('Welcome Back!', 'Ready to crush your goals today?', 0);
    } else {
        alert('Invalid username or password!');
    }
}

// Register Function
function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!username || !password || !confirmPassword) {
        alert('Please fill in all fields!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (users[username]) {
        alert('Username already exists!');
        return;
    }

    // Create new user
    users[username] = {
        password: password,
        profile: {},
        gamification: {
            level: 1,
            xp: 0,
            streak: 0,
            lastWorkoutDate: null,
            totalWorkouts: 0,
            badges: [],
            waterGlasses: 0,
            lastWaterReset: new Date().toDateString()
        },
        foodLog: [],
        totalCaloriesConsumed: 0,
        weightHistory: [],
        achievements: []
    };

    localStorage.setItem('fitnessUsers', JSON.stringify(users));
    alert('Account created successfully! Please login.');
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

// Logout Function
function logout() {
    saveUserData();
    currentUser = null;
    mainApp.classList.add('hidden');
    authScreen.classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// Load User Data
function loadUserData() {
    const userData = users[currentUser];
    
    // Load profile
    if (userData.profile.height) {
        document.getElementById('height').value = userData.profile.height;
        document.getElementById('weight').value = userData.profile.weight;
        document.getElementById('age').value = userData.profile.age;
        document.getElementById('gender').value = userData.profile.gender;
        document.getElementById('activity').value = userData.profile.activity;
        document.getElementById('goal').value = userData.profile.goal;
    }

    // Load gamification
    updateGamificationDisplay();
    
    // Load food log
    foodLog = userData.foodLog || [];
    totalCaloriesConsumed = userData.totalCaloriesConsumed || 0;
    
    // Check water reset
    checkWaterReset();
    
    // Load results if profile exists
    if (userData.profile.height) {
        calculateFitnessPlan();
    }

    // Update motivational quote
    updateMotivationalQuote();
    
    // Generate daily challenge
    generateDailyChallenge();
}

// Save User Data
function saveUserData() {
    if (!currentUser) return;
    
    users[currentUser].foodLog = foodLog;
    users[currentUser].totalCaloriesConsumed = totalCaloriesConsumed;
    localStorage.setItem('fitnessUsers', JSON.stringify(users));
}

// ========================
// GAMIFICATION SYSTEM
// ========================

const BADGES = [
    { id: 'first_login', icon: '🎯', title: 'Welcome!', description: 'Joined the fitness journey', xp: 10 },
    { id: 'profile_complete', icon: '📝', title: 'Profile Pro', description: 'Completed profile', xp: 20 },
    { id: 'first_workout', icon: '💪', title: 'First Steps', description: 'Logged first workout', xp: 30 },
    { id: 'streak_3', icon: '🔥', title: '3-Day Streak', description: '3 days in a row', xp: 50 },
    { id: 'streak_7', icon: '⚡', title: 'Week Warrior', description: '7-day workout streak', xp: 100 },
    { id: 'workout_10', icon: '🏅', title: 'Dedicated', description: '10 total workouts', xp: 75 },
    { id: 'workout_25', icon: '🌟', title: 'Committed', description: '25 total workouts', xp: 150 },
    { id: 'workout_50', icon: '👑', title: 'Champion', description: '50 total workouts', xp: 300 },
    { id: 'hydration_hero', icon: '💧', title: 'Hydration Hero', description: 'Hit water goal 7 days', xp: 50 },
    { id: 'early_bird', icon: '🌅', title: 'Early Bird', description: 'Morning workout logged', xp: 25 },
    { id: 'calorie_tracker', icon: '🍽️', title: 'Calorie Counter', description: 'Tracked 7 days of meals', xp: 75 },
    { id: 'level_5', icon: '⭐', title: 'Rising Star', description: 'Reached Level 5', xp: 100 },
    { id: 'level_10', icon: '💫', title: 'Fitness Expert', description: 'Reached Level 10', xp: 200 }
];

function updateGamificationDisplay() {
    const userData = users[currentUser].gamification;
    
    document.getElementById('userLevel').textContent = userData.level;
    document.getElementById('userXP').textContent = userData.xp;
    document.getElementById('streakCount').textContent = userData.streak;
    document.getElementById('totalWorkouts').textContent = userData.totalWorkouts;
    document.getElementById('badgesEarned').textContent = userData.badges.length;
    document.getElementById('waterGlasses').textContent = `${userData.waterGlasses}/8`;
    
    // Update XP bar
    const xpForNextLevel = userData.level * 100;
    const xpProgress = (userData.xp / xpForNextLevel) * 100;
    document.getElementById('xpProgress').style.width = xpProgress + '%';
    document.getElementById('currentXP').textContent = userData.xp;
    document.getElementById('nextLevelXP').textContent = xpForNextLevel;
    
    // Display recent badges
    displayRecentBadges();
}

function addXP(amount, reason) {
    const userData = users[currentUser].gamification;
    userData.xp += amount;
    
    // Check for level up
    const xpForNextLevel = userData.level * 100;
    if (userData.xp >= xpForNextLevel) {
        userData.xp -= xpForNextLevel;
        userData.level++;
        showAchievementPopup('🎉 Level Up!', `You reached Level ${userData.level}!`, amount);
        
        // Check for level badges
        checkLevelBadges();
    } else {
        showAchievementPopup('XP Gained!', reason, amount);
    }
    
    updateGamificationDisplay();
    saveUserData();
}

function unlockBadge(badgeId) {
    const userData = users[currentUser].gamification;
    
    if (userData.badges.includes(badgeId)) return;
    
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return;
    
    userData.badges.push(badgeId);
    userData.xp += badge.xp;
    
    showAchievementPopup(`${badge.icon} Badge Unlocked!`, badge.title, badge.xp);
    updateGamificationDisplay();
    saveUserData();
}

function displayRecentBadges() {
    const userData = users[currentUser].gamification;
    const achievementsList = document.getElementById('achievementsList');
    
    const recentBadges = BADGES.filter(badge => userData.badges.includes(badge.id)).slice(-3);
    
    if (recentBadges.length === 0) {
        achievementsList.innerHTML = '<p style="text-align: center; color: #999;">Complete actions to earn badges!</p>';
        return;
    }
    
    achievementsList.innerHTML = recentBadges.map(badge => `
        <div class="achievement-badge">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-description">${badge.description}</div>
        </div>
    `).join('');
}

function showAchievementPopup(title, description, xp) {
    const popup = document.getElementById('achievementPopup');
    document.getElementById('achievementTitle').textContent = title;
    document.getElementById('achievementDescription').textContent = description;
    document.getElementById('xpEarned').textContent = xp;
    
    popup.classList.remove('hidden');
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.classList.add('hidden'), 300);
    }, 3000);
}

function checkLevelBadges() {
    const level = users[currentUser].gamification.level;
    if (level === 5) unlockBadge('level_5');
    if (level === 10) unlockBadge('level_10');
}

// ========================
// QUICK ACTIONS
// ========================

document.getElementById('logWorkoutBtn').addEventListener('click', logWorkout);
document.getElementById('addWaterBtn').addEventListener('click', addWater);
document.getElementById('viewProgressBtn').addEventListener('click', viewProgress);
document.getElementById('viewBadgesBtn').addEventListener('click', viewAllBadges);

function logWorkout() {
    const userData = users[currentUser].gamification;
    const today = new Date().toDateString();
    
    // Update workout count
    userData.totalWorkouts++;
    
    // Update streak
    if (userData.lastWorkoutDate === today) {
        alert('You already logged a workout today! Great job! 💪');
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (userData.lastWorkoutDate === yesterday.toDateString()) {
        userData.streak++;
    } else if (userData.lastWorkoutDate !== today) {
        userData.streak = 1;
    }
    
    userData.lastWorkoutDate = today;
    
    // Award XP
    addXP(25, 'Workout logged!');
    
    // Check for badges
    if (userData.totalWorkouts === 1) unlockBadge('first_workout');
    if (userData.totalWorkouts === 10) unlockBadge('workout_10');
    if (userData.totalWorkouts === 25) unlockBadge('workout_25');
    if (userData.totalWorkouts === 50) unlockBadge('workout_50');
    if (userData.streak === 3) unlockBadge('streak_3');
    if (userData.streak === 7) unlockBadge('streak_7');
    
    // Check if morning workout
    const hour = new Date().getHours();
    if (hour >= 5 && hour <= 9) {
        unlockBadge('early_bird');
    }
    
    updateGamificationDisplay();
    saveUserData();
}

function addWater() {
    const userData = users[currentUser].gamification;
    
    if (userData.waterGlasses >= 8) {
        alert('Great job! You\'ve hit your water goal for today! 💧');
        return;
    }
    
    userData.waterGlasses++;
    
    if (userData.waterGlasses === 8) {
        addXP(15, 'Water goal completed!');
    } else {
        addXP(2, 'Water added!');
    }
    
    updateGamificationDisplay();
    saveUserData();
}

function checkWaterReset() {
    const userData = users[currentUser].gamification;
    const today = new Date().toDateString();
    
    if (userData.lastWaterReset !== today) {
        userData.waterGlasses = 0;
        userData.lastWaterReset = today;
        saveUserData();
    }
}

function viewProgress() {
    // Simple progress view - can be enhanced with charts
    const userData = users[currentUser];
    const gamData = userData.gamification;
    
    alert(`🎯 Your Progress:
    
Level: ${gamData.level}
Total XP: ${gamData.xp + (gamData.level - 1) * 100}
Workout Streak: ${gamData.streak} days
Total Workouts: ${gamData.totalWorkouts}
Badges Earned: ${gamData.badges.length}/${BADGES.length}

Keep up the great work! 💪`);
}

function viewAllBadges() {
    const modal = document.getElementById('badgesModal');
    const badgesGrid = document.getElementById('allBadgesGrid');
    const userData = users[currentUser].gamification;
    
    badgesGrid.innerHTML = BADGES.map(badge => {
        const isUnlocked = userData.badges.includes(badge.id);
        return `
            <div class="achievement-badge ${isUnlocked ? '' : 'locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-title">${badge.title}</div>
                <div class="badge-description">${badge.description}</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">${badge.xp} XP</div>
            </div>
        `;
    }).join('');
    
    modal.classList.add('show');
}

// Close modals
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('show');
    });
});

// ========================
// DAILY CHALLENGE
// ========================

const CHALLENGES = [
    { text: 'Complete a 30-minute workout', xp: 50 },
    { text: 'Drink 8 glasses of water', xp: 30 },
    { text: 'Log all your meals today', xp: 40 },
    { text: 'Do 50 push-ups (in sets)', xp: 45 },
    { text: 'Run/walk 5km', xp: 60 },
    { text: 'Try a new healthy recipe', xp: 35 },
    { text: 'Meditate for 10 minutes', xp: 25 },
    { text: 'Do a full-body stretch routine', xp: 30 },
    { text: 'Complete 100 squats', xp: 50 },
    { text: 'Sleep 8 hours tonight', xp: 40 }
];

function generateDailyChallenge() {
    const userData = users[currentUser];
    const today = new Date().toDateString();
    
    // Check if challenge already completed today
    if (userData.lastChallengeDate === today && userData.challengeCompleted) {
        document.getElementById('dailyChallenge').innerHTML = `
            <p class="challenge-text">✅ Today's challenge completed! Come back tomorrow for a new challenge.</p>
        `;
        return;
    }
    
    // Generate or use existing challenge
    if (!userData.dailyChallenge || userData.lastChallengeDate !== today) {
        const randomChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
        userData.dailyChallenge = randomChallenge;
        userData.lastChallengeDate = today;
        userData.challengeCompleted = false;
        saveUserData();
    }
    
    document.getElementById('dailyChallenge').innerHTML = `
        <p class="challenge-text">${userData.dailyChallenge.text}</p>
        <button id="completeChallengeBtn" class="btn btn-challenge">Mark Complete (+${userData.dailyChallenge.xp} XP)</button>
    `;
    
    document.getElementById('completeChallengeBtn').addEventListener('click', completeChallenge);
}

function completeChallenge() {
    const userData = users[currentUser];
    userData.challengeCompleted = true;
    
    addXP(userData.dailyChallenge.xp, 'Daily challenge completed!');
    generateDailyChallenge();
    saveUserData();
}

// ========================
// MOTIVATIONAL QUOTES
// ========================

const QUOTES = [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Don't stop when you're tired. Stop when you're done.",
    "The harder you work, the luckier you get.",
    "Success starts with self-discipline.",
    "Train like a beast, look like a beauty.",
    "Your only limit is you.",
    "Push yourself because no one else is going to do it for you.",
    "Great things never come from comfort zones."
];

function updateMotivationalQuote() {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    document.getElementById('motivationalQuote').textContent = quote;
}

// ========================
// FITNESS CALCULATIONS (Original Code)
// ========================

let userData = {};
let foodLog = [];
let totalCaloriesConsumed = 0;

const calculateBtn = document.getElementById('calculateBtn');
const resultsSection = document.getElementById('resultsSection');
const addFoodBtn = document.getElementById('addFoodBtn');

calculateBtn.addEventListener('click', calculateFitnessPlan);
addFoodBtn.addEventListener('click', addFood);

function calculateFitnessPlan() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const age = parseFloat(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activity = document.getElementById('activity').value;
    const goal = document.getElementById('goal').value;

    if (!height || !weight || !age) {
        alert('Please fill in all required fields!');
        return;
    }

    userData = { height, weight, age, gender, activity, goal };
    
    // Save to user profile
    users[currentUser].profile = userData;
    saveUserData();

    const bmi = calculateBMI(height, weight);
    displayBMI(bmi);

    const calories = calculateCalories(weight, height, age, gender, activity, goal);
    displayCalories(calories);

    generateDietPlan(calories, goal);
    generateExercisePlan(goal, bmi);
    generateSleepSchedule(age, goal);

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Award XP and check badge
    addXP(20, 'Profile calculated!');
    unlockBadge('profile_complete');
}

function calculateBMI(height, weight) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

function displayBMI(bmi) {
    document.getElementById('bmiValue').textContent = bmi;
    
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    
    document.getElementById('bmiCategory').textContent = category;
}

function calculateCalories(weight, height, age, gender, activity, goal) {
    let bmr;
    
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryactive: 1.9
    };
    
    let tdee = bmr * activityMultipliers[activity];
    
    if (goal === 'lose') {
        tdee -= 500;
    } else if (goal === 'gain') {
        tdee += 500;
    }
    
    return Math.round(tdee);
}

function displayCalories(calories) {
    document.getElementById('calorieValue').textContent = `${calories} cal`;
    document.getElementById('targetCalories').textContent = calories;
    
    let goalText = '';
    if (userData.goal === 'lose') {
        goalText = '-0.5 kg';
    } else if (userData.goal === 'gain') {
        goalText = '+0.5 kg';
    } else {
        goalText = 'Maintain';
    }
    
    document.getElementById('goalValue').textContent = goalText;
}

function generateDietPlan(calories, goal) {
    let proteinPercent, carbsPercent, fatsPercent;
    
    if (goal === 'lose') {
        proteinPercent = 0.35;
        carbsPercent = 0.35;
        fatsPercent = 0.30;
    } else if (goal === 'gain') {
        proteinPercent = 0.30;
        carbsPercent = 0.45;
        fatsPercent = 0.25;
    } else {
        proteinPercent = 0.30;
        carbsPercent = 0.40;
        fatsPercent = 0.30;
    }
    
    const proteinCal = Math.round(calories * proteinPercent);
    const carbsCal = Math.round(calories * carbsPercent);
    const fatsCal = Math.round(calories * fatsPercent);
    
    const proteinGrams = Math.round(proteinCal / 4);
    const carbsGrams = Math.round(carbsCal / 4);
    const fatsGrams = Math.round(fatsCal / 9);
    
    document.getElementById('proteinValue').textContent = `${proteinGrams}g (${proteinCal} cal)`;
    document.getElementById('carbsValue').textContent = `${carbsGrams}g (${carbsCal} cal)`;
    document.getElementById('fatsValue').textContent = `${fatsGrams}g (${fatsCal} cal)`;
    
    const mealPlan = document.getElementById('mealPlan');
    const meals = getMealSuggestions(goal);
    
    mealPlan.innerHTML = meals.map(meal => `
        <div class="meal">
            <h3>${meal.name}</h3>
            <ul>
                ${meal.foods.map(food => `<li>${food}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function getMealSuggestions(goal) {
    const mealPlans = {
        lose: [
            {
                name: '🌅 Breakfast (7:00 AM - 8:00 AM)',
                foods: [
                    'Oatmeal with berries and almonds',
                    'Greek yogurt with honey',
                    'Green tea or black coffee',
                    'Boiled eggs (2) with whole wheat toast'
                ]
            },
            {
                name: '🥪 Mid-Morning Snack (10:30 AM)',
                foods: [
                    'Apple or banana',
                    'Handful of mixed nuts',
                    'Protein shake'
                ]
            },
            {
                name: '🍽️ Lunch (1:00 PM - 2:00 PM)',
                foods: [
                    'Grilled chicken salad with olive oil',
                    'Brown rice or quinoa (1 cup)',
                    'Steamed vegetables',
                    'Lentil soup'
                ]
            },
            {
                name: '🥗 Evening Snack (4:30 PM)',
                foods: [
                    'Carrot sticks with hummus',
                    'Low-fat cottage cheese',
                    'Herbal tea'
                ]
            },
            {
                name: '🍲 Dinner (7:00 PM - 8:00 PM)',
                foods: [
                    'Grilled fish or tofu',
                    'Roasted vegetables',
                    'Mixed green salad',
                    'Sweet potato (small)'
                ]
            }
        ],
        maintain: [
            {
                name: '🌅 Breakfast (7:00 AM - 8:00 AM)',
                foods: [
                    'Whole grain cereal with milk',
                    'Scrambled eggs with vegetables',
                    'Fresh fruit smoothie',
                    'Whole wheat toast with peanut butter'
                ]
            },
            {
                name: '🥪 Mid-Morning Snack (10:30 AM)',
                foods: [
                    'Greek yogurt with granola',
                    'Mixed nuts and dried fruits',
                    'Protein bar'
                ]
            },
            {
                name: '🍽️ Lunch (1:00 PM - 2:00 PM)',
                foods: [
                    'Chicken breast with brown rice',
                    'Mixed vegetables stir-fry',
                    'Whole grain pasta with lean meat',
                    'Side salad with vinaigrette'
                ]
            },
            {
                name: '🥗 Evening Snack (4:30 PM)',
                foods: [
                    'Protein shake',
                    'Cheese with whole grain crackers',
                    'Fresh fruit'
                ]
            },
            {
                name: '🍲 Dinner (7:00 PM - 8:00 PM)',
                foods: [
                    'Grilled salmon or chicken',
                    'Quinoa or brown rice',
                    'Steamed broccoli and carrots',
                    'Mixed green salad'
                ]
            }
        ],
        gain: [
            {
                name: '🌅 Breakfast (7:00 AM - 8:00 AM)',
                foods: [
                    'Oatmeal with banana and peanut butter',
                    '4 whole eggs with cheese',
                    'Whole wheat toast with avocado',
                    'Protein shake with milk'
                ]
            },
            {
                name: '🥪 Mid-Morning Snack (10:30 AM)',
                foods: [
                    'Protein bar',
                    'Nuts and dried fruits (large portion)',
                    'Greek yogurt with granola'
                ]
            },
            {
                name: '🍽️ Lunch (1:00 PM - 2:00 PM)',
                foods: [
                    'Chicken breast (200g) with rice',
                    'Sweet potato (large)',
                    'Mixed vegetables with olive oil',
                    'Lentils or beans'
                ]
            },
            {
                name: '🥗 Pre-Workout Snack (4:00 PM)',
                foods: [
                    'Banana with peanut butter',
                    'Energy bar',
                    'White rice with honey'
                ]
            },
            {
                name: '💪 Post-Workout (6:00 PM)',
                foods: [
                    'Protein shake (30g protein)',
                    'Chocolate milk',
                    'White bread sandwich'
                ]
            },
            {
                name: '🍲 Dinner (8:00 PM - 9:00 PM)',
                foods: [
                    'Grilled steak or salmon (250g)',
                    'Brown rice or pasta (large serving)',
                    'Roasted vegetables',
                    'Avocado salad'
                ]
            }
        ]
    };
    
    return mealPlans[goal];
}

function generateExercisePlan(goal, bmi) {
    const exercisePlan = document.getElementById('exercisePlan');
    const exerciseSchedule = document.getElementById('exerciseSchedule');
    
    let exercises;
    
    if (goal === 'lose') {
        exercises = [
            {
                day: 'Monday - Cardio & Core',
                workouts: [
                    { name: 'Running/Jogging', details: '30-40 minutes' },
                    { name: 'Planks', details: '3 sets x 30-60 seconds' },
                    { name: 'Bicycle Crunches', details: '3 sets x 20 reps' },
                    { name: 'Mountain Climbers', details: '3 sets x 15 reps' }
                ]
            },
            {
                day: 'Tuesday - Strength Training',
                workouts: [
                    { name: 'Push-ups', details: '3 sets x 12-15 reps' },
                    { name: 'Dumbbell Rows', details: '3 sets x 12 reps' },
                    { name: 'Squats', details: '3 sets x 15 reps' },
                    { name: 'Lunges', details: '3 sets x 12 reps each leg' }
                ]
            },
            {
                day: 'Wednesday - HIIT & Cardio',
                workouts: [
                    { name: 'Burpees', details: '4 sets x 10 reps' },
                    { name: 'Jump Rope', details: '20 minutes' },
                    { name: 'High Knees', details: '3 sets x 30 seconds' },
                    { name: 'Jumping Jacks', details: '3 sets x 30 reps' }
                ]
            },
            {
                day: 'Thursday - Active Recovery',
                workouts: [
                    { name: 'Yoga', details: '30 minutes' },
                    { name: 'Walking', details: '45 minutes' },
                    { name: 'Stretching', details: '15 minutes' }
                ]
            },
            {
                day: 'Friday - Full Body Circuit',
                workouts: [
                    { name: 'Circuit Training', details: '30 minutes' },
                    { name: 'Kettlebell Swings', details: '3 sets x 15 reps' },
                    { name: 'Box Jumps', details: '3 sets x 10 reps' },
                    { name: 'Battle Ropes', details: '3 sets x 30 seconds' }
                ]
            },
            {
                day: 'Saturday - Cardio',
                workouts: [
                    { name: 'Cycling', details: '45-60 minutes' },
                    { name: 'Swimming', details: '30 minutes (alternative)' },
                    { name: 'Core Work', details: '15 minutes' }
                ]
            },
            {
                day: 'Sunday - Rest & Recovery',
                workouts: [
                    { name: 'Light Stretching', details: '20 minutes' },
                    { name: 'Walk', details: '30 minutes (optional)' },
                    { name: 'Foam Rolling', details: '15 minutes' }
                ]
            }
        ];
    } else if (goal === 'gain') {
        exercises = [
            {
                day: 'Monday - Chest & Triceps',
                workouts: [
                    { name: 'Bench Press', details: '4 sets x 8-12 reps' },
                    { name: 'Incline Dumbbell Press', details: '3 sets x 10-12 reps' },
                    { name: 'Cable Flyes', details: '3 sets x 12-15 reps' },
                    { name: 'Tricep Dips', details: '3 sets x 10-12 reps' },
                    { name: 'Tricep Pushdowns', details: '3 sets x 12-15 reps' }
                ]
            },
            {
                day: 'Tuesday - Back & Biceps',
                workouts: [
                    { name: 'Deadlifts', details: '4 sets x 6-8 reps' },
                    { name: 'Pull-ups/Lat Pulldowns', details: '4 sets x 8-12 reps' },
                    { name: 'Barbell Rows', details: '3 sets x 10-12 reps' },
                    { name: 'Bicep Curls', details: '3 sets x 12-15 reps' },
                    { name: 'Hammer Curls', details: '3 sets x 12-15 reps' }
                ]
            },
            {
                day: 'Wednesday - Legs',
                workouts: [
                    { name: 'Squats', details: '4 sets x 8-12 reps' },
                    { name: 'Leg Press', details: '3 sets x 12-15 reps' },
                    { name: 'Romanian Deadlifts', details: '3 sets x 10-12 reps' },
                    { name: 'Leg Curls', details: '3 sets x 12-15 reps' },
                    { name: 'Calf Raises', details: '4 sets x 15-20 reps' }
                ]
            },
            {
                day: 'Thursday - Shoulders & Abs',
                workouts: [
                    { name: 'Overhead Press', details: '4 sets x 8-12 reps' },
                    { name: 'Lateral Raises', details: '3 sets x 12-15 reps' },
                    { name: 'Front Raises', details: '3 sets x 12-15 reps' },
                    { name: 'Face Pulls', details: '3 sets x 15 reps' },
                    { name: 'Weighted Crunches', details: '3 sets x 15-20 reps' }
                ]
            },
            {
                day: 'Friday - Upper Body Power',
                workouts: [
                    { name: 'Incline Bench Press', details: '4 sets x 6-8 reps' },
                    { name: 'Weighted Pull-ups', details: '4 sets x 6-8 reps' },
                    { name: 'Dumbbell Shoulder Press', details: '3 sets x 8-10 reps' },
                    { name: 'Close-Grip Bench', details: '3 sets x 10-12 reps' }
                ]
            },
            {
                day: 'Saturday - Lower Body Power',
                workouts: [
                    { name: 'Front Squats', details: '4 sets x 6-8 reps' },
                    { name: 'Bulgarian Split Squats', details: '3 sets x 10 each leg' },
                    { name: 'Leg Extensions', details: '3 sets x 12-15 reps' },
                    { name: 'Seated Calf Raises', details: '4 sets x 15-20 reps' }
                ]
            },
            {
                day: 'Sunday - Rest & Recovery',
                workouts: [
                    { name: 'Light Cardio', details: '20 minutes walk' },
                    { name: 'Stretching', details: '20 minutes' },
                    { name: 'Foam Rolling', details: '15 minutes' }
                ]
            }
        ];
    } else {
        exercises = [
            {
                day: 'Monday - Full Body Strength',
                workouts: [
                    { name: 'Squats', details: '3 sets x 12 reps' },
                    { name: 'Push-ups', details: '3 sets x 15 reps' },
                    { name: 'Dumbbell Rows', details: '3 sets x 12 reps' },
                    { name: 'Plank', details: '3 sets x 45 seconds' }
                ]
            },
            {
                day: 'Tuesday - Cardio',
                workouts: [
                    { name: 'Running/Jogging', details: '30 minutes' },
                    { name: 'Jump Rope', details: '10 minutes' },
                    { name: 'Core Work', details: '15 minutes' }
                ]
            },
            {
                day: 'Wednesday - Upper Body',
                workouts: [
                    { name: 'Bench Press', details: '3 sets x 10-12 reps' },
                    { name: 'Shoulder Press', details: '3 sets x 10-12 reps' },
                    { name: 'Bicep Curls', details: '3 sets x 12 reps' },
                    { name: 'Tricep Extensions', details: '3 sets x 12 reps' }
                ]
            },
            {
                day: 'Thursday - Active Recovery',
                workouts: [
                    { name: 'Yoga', details: '30 minutes' },
                    { name: 'Swimming', details: '20 minutes' },
                    { name: 'Stretching', details: '15 minutes' }
                ]
            },
            {
                day: 'Friday - Lower Body',
                workouts: [
                    { name: 'Deadlifts', details: '3 sets x 10 reps' },
                    { name: 'Lunges', details: '3 sets x 12 each leg' },
                    { name: 'Leg Press', details: '3 sets x 12 reps' },
                    { name: 'Calf Raises', details: '3 sets x 15 reps' }
                ]
            },
            {
                day: 'Saturday - Mixed Cardio',
                workouts: [
                    { name: 'Cycling', details: '30 minutes' },
                    { name: 'HIIT Circuit', details: '20 minutes' },
                    { name: 'Stretching', details: '10 minutes' }
                ]
            },
            {
                day: 'Sunday - Rest',
                workouts: [
                    { name: 'Light Walk', details: '30 minutes' },
                    { name: 'Stretching', details: '15 minutes' }
                ]
            }
        ];
    }
    
    exercisePlan.innerHTML = exercises.map(day => `
        <div class="exercise-day">
            <h3>${day.day}</h3>
            ${day.workouts.map(workout => `
                <div class="exercise-item">
                    <span class="exercise-name">${workout.name}</span>
                    <span class="exercise-details">${workout.details}</span>
                </div>
            `).join('')}
        </div>
    `).join('');
    
    const timingSchedule = getExerciseTiming(goal);
    exerciseSchedule.innerHTML = `
        <h3>⏰ Best Times to Exercise</h3>
        ${timingSchedule.map(time => `
            <div class="schedule-item">
                <strong>${time.period}</strong>
                <span>${time.reason}</span>
            </div>
        `).join('')}
    `;
}

function getExerciseTiming(goal) {
    if (goal === 'lose') {
        return [
            { period: 'Morning (6:00-8:00 AM)', reason: 'Fasted cardio burns more fat' },
            { period: 'Evening (5:00-7:00 PM)', reason: 'Peak strength and endurance' }
        ];
    } else if (goal === 'gain') {
        return [
            { period: 'Late Morning (10:00-12:00 PM)', reason: 'Testosterone levels peak' },
            { period: 'Late Afternoon (4:00-6:00 PM)', reason: 'Body temperature highest, optimal performance' }
        ];
    } else {
        return [
            { period: 'Morning (7:00-9:00 AM)', reason: 'Energizes your day' },
            { period: 'Evening (5:00-7:00 PM)', reason: 'Relieves daily stress' }
        ];
    }
}

function generateSleepSchedule(age, goal) {
    const sleepSchedule = document.getElementById('sleepSchedule');
    
    let sleepHours;
    if (age < 18) sleepHours = '8-10';
    else if (age < 65) sleepHours = '7-9';
    else sleepHours = '7-8';
    
    let recommendedBedtime, recommendedWakeup;
    
    if (goal === 'lose' || goal === 'maintain') {
        recommendedBedtime = '10:00 PM';
        recommendedWakeup = '6:00 AM';
    } else {
        recommendedBedtime = '10:30 PM';
        recommendedWakeup = '7:00 AM';
    }
    
    sleepSchedule.innerHTML = `
        <div class="sleep-recommendation">
            <h3>💤 Recommended Sleep Duration</h3>
            <p style="font-size: 1.3rem; font-weight: bold; color: #667eea;">${sleepHours} hours per night</p>
        </div>
        <div class="sleep-recommendation">
            <h3>🌙 Optimal Sleep Schedule</h3>
            <p><strong>Bedtime:</strong> ${recommendedBedtime}</p>
            <p><strong>Wake-up:</strong> ${recommendedWakeup}</p>
        </div>
        <div class="sleep-recommendation">
            <h3>✨ Sleep Tips for Recovery</h3>
            <ul style="padding-left: 20px;">
                <li>Avoid caffeine 6 hours before bed</li>
                <li>Keep room temperature cool (60-67°F / 15-19°C)</li>
                <li>Avoid screens 1 hour before sleep</li>
                <li>Establish a consistent sleep schedule</li>
                <li>Consider a warm shower before bed</li>
                ${goal === 'gain' ? '<li>Consume casein protein before bed for muscle recovery</li>' : ''}
                ${goal === 'lose' ? '<li>Light dinner 3 hours before sleep for better fat burning</li>' : ''}
            </ul>
        </div>
        <div class="sleep-recommendation">
            <h3>⚡ Recovery Benefits</h3>
            <p>Adequate sleep helps with:</p>
            <ul style="padding-left: 20px;">
                <li><strong>Muscle Recovery:</strong> Growth hormone released during deep sleep</li>
                <li><strong>Metabolism:</strong> Regulates hunger hormones</li>
                <li><strong>Performance:</strong> Improves strength and endurance</li>
                <li><strong>Mental Health:</strong> Reduces stress and improves mood</li>
            </ul>
        </div>
    `;
}

function addFood() {
    const foodItem = document.getElementById('foodItem').value;
    const foodCalories = parseFloat(document.getElementById('foodCalories').value);
    
    if (!foodItem || !foodCalories) {
        alert('Please enter both food item and calories!');
        return;
    }
    
    const food = {
        id: Date.now(),
        name: foodItem,
        calories: foodCalories
    };
    
    foodLog.push(food);
    totalCaloriesConsumed += foodCalories;
    
    displayFoodLog();
    updateCalorieProgress();
    
    document.getElementById('foodItem').value = '';
    document.getElementById('foodCalories').value = '';
    
    // Award XP
    addXP(5, 'Food logged!');
    saveUserData();
}

function displayFoodLog() {
    const foodLogDiv = document.getElementById('foodLog');
    
    if (foodLog.length === 0) {
        foodLogDiv.innerHTML = '<p style="text-align: center; color: #999;">No food entries yet</p>';
        return;
    }
    
    foodLogDiv.innerHTML = foodLog.map(food => `
        <div class="food-entry">
            <span class="food-name">${food.name}</span>
            <span class="food-calories">${food.calories} cal</span>
            <button class="delete-btn" onclick="deleteFood(${food.id})">Delete</button>
        </div>
    `).join('');
}

function deleteFood(id) {
    const food = foodLog.find(f => f.id === id);
    totalCaloriesConsumed -= food.calories;
    foodLog = foodLog.filter(f => f.id !== id);
    
    displayFoodLog();
    updateCalorieProgress();
    saveUserData();
}

function updateCalorieProgress() {
    document.getElementById('totalCalories').textContent = totalCaloriesConsumed;
    
    const targetCalories = parseInt(document.getElementById('targetCalories').textContent) || 2000;
    const percentage = Math.min((totalCaloriesConsumed / targetCalories) * 100, 100);
    
    const progressBar = document.getElementById('calorieProgress');
    progressBar.style.width = percentage + '%';
    
    if (percentage > 100) {
        progressBar.style.background = 'linear-gradient(90deg, #f44336 0%, #da190b 100%)';
    } else if (percentage > 90) {
        progressBar.style.background = 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)';
    }
}

// Initialize
displayFoodLog();