const questions = [
    {
        question: "What kind of product do we provide?",
        answers: ["SaaS Platform", "CRM Platform", "Brand Aggregator", "Affiliate Aggregator"],
        correct: [0, 1] // SaaS Platform and CRM Platform
    },
    {
        question: "For which area is the product intended?",
        answers: ["Affiliate Marketing", "Entertainment", "API Development", "Finance Area"],
        correct: [0] // Affiliate Marketing
    },
    {
        question: "Who can be our client in this business area?",
        answers: ["Broker", "Advertiser", "Brand", "Affiliate"],
        correct: [0, 1] // Broker and Advertiser
    },
    {
        question: "Brand can also be called…",
        answers: ["Broker", "Affiliate", "Web", "Advertiser"],
        correct: [0] // Broker
    },
    {
        question: "Who sends the traffic?",
        answers: ["Affiliate", "Accounting Officer", "Web Designer", "Brand"],
        correct: [0] // Affiliate
    }
];

let currentQuestionIndex = 0;
let totalScore = 0;
let maxPossibleScore = 0;
let selectedAnswers = [];
let userName = '';
let answered = false;
let userAnswers = []; // Store all user answers for Google Sheets

// Google Sheets configuration
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwdGvoZcyAZbL7Mr-dHIP9JDXHmrG_o50akjXGNjeY7l8H-pB1dSAxfkMQNIIkS6x1KKw/exec';
const SHEET_ID = '1-Hn5Ym3eimhpnWNQAfs0ffziDaI0Rf4XmbMmll-NKOM';

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Calculate max possible score
questions.forEach(q => {
    maxPossibleScore += q.correct.length;
});

function startQuiz() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    
    if (!firstName || !lastName) {
        alert('Please enter both first and last name to continue.');
        return;
    }
    
    userName = firstName + ' ' + lastName;
    document.getElementById('nameForm').classList.add('hidden');
    document.getElementById('quizHeader').classList.remove('hidden');
    document.getElementById('quizContent').classList.remove('hidden');
    
    showQuestion();
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCounter').textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    selectedAnswers = [];
    answered = false;
    
    question.answers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        answerDiv.onclick = () => toggleAnswer(index);
        
        answerDiv.innerHTML = `
            <input type="checkbox" class="answer-checkbox" id="answer${index}">
            <label class="answer-text" for="answer${index}">${answer}</label>
        `;
        
        answersContainer.appendChild(answerDiv);
    });
    
    document.getElementById('submitBtn').classList.remove('hidden');
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('feedback').classList.remove('show');
}

function toggleAnswer(index) {
    if (answered) return;
    
    const checkbox = document.getElementById(`answer${index}`);
    const option = checkbox.parentElement;
    
    if (selectedAnswers.includes(index)) {
        selectedAnswers = selectedAnswers.filter(i => i !== index);
        checkbox.checked = false;
        option.classList.remove('selected');
    } else {
        selectedAnswers.push(index);
        checkbox.checked = true;
        option.classList.add('selected');
    }
}

function submitAnswer() {
    if (selectedAnswers.length === 0) {
        alert('Please select at least one answer.');
        return;
    }
    
    answered = true;
    const question = questions[currentQuestionIndex];
    
    // Disable all answer options
    const allOptions = document.querySelectorAll('.answer-option');
    const allCheckboxes = document.querySelectorAll('.answer-checkbox');
    
    allOptions.forEach(option => {
        option.classList.add('disabled');
        option.onclick = null; // Remove click handler
    });
    
    allCheckboxes.forEach(checkbox => {
        checkbox.disabled = true;
    });
    
    // Calculate score for this question
    let correctAnswers = 0;
    selectedAnswers.forEach(index => {
        if (question.correct.includes(index)) {
            correctAnswers++;
        }
    });
    
    // Add points for correct answers
    totalScore += correctAnswers;
    
    // Store the answer data for Google Sheets
    const answerData = {
        questionNumber: currentQuestionIndex + 1,
        question: question.question,
        selectedAnswers: selectedAnswers.map(index => question.answers[index]),
        correctAnswers: question.correct.map(index => question.answers[index]),
        isCorrect: correctAnswers === question.correct.length && selectedAnswers.length === question.correct.length,
        pointsScored: correctAnswers,
        maxPoints: question.correct.length
    };
    userAnswers.push(answerData);
    
    // Show visual feedback
    question.answers.forEach((answer, index) => {
        const option = document.querySelector(`#answer${index}`).parentElement;
        if (question.correct.includes(index)) {
            option.classList.add('correct');
        } else if (selectedAnswers.includes(index)) {
            option.classList.add('incorrect');
        }
    });
    
    // Show feedback
    const feedbackScore = document.getElementById('feedbackScore');
    feedbackScore.textContent = `You scored ${correctAnswers} out of ${question.correct.length} points for this question.`;
    document.getElementById('feedback').classList.add('show');
    
    document.getElementById('submitBtn').classList.add('hidden');
    
    if (currentQuestionIndex < questions.length - 1) {
        document.getElementById('nextBtn').textContent = 'Next Question';
        document.getElementById('nextBtn').classList.remove('hidden');
    } else {
        document.getElementById('nextBtn').textContent = 'View Results';
        document.getElementById('nextBtn').classList.remove('hidden');
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('quizHeader').classList.add('hidden');
    document.getElementById('quizContent').classList.add('hidden');
    document.getElementById('results').classList.add('show');
    
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('finalScore').textContent = `${totalScore}/${maxPossibleScore}`;
    
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);
    
    document.getElementById('participantInfo').innerHTML = `<strong>Participant:</strong> ${userName}`;
    document.getElementById('completionDate').textContent = formatDate(new Date());
    document.getElementById('scoreBreakdown').textContent = `${totalScore} correct answers out of ${maxPossibleScore} total points`;
    document.getElementById('percentage').textContent = `${percentage}%`;
    
    // Send data to Google Sheets
    sendToGoogleSheets();
}

function downloadResultsAsImage() {
    const canvas = document.getElementById('screenshotCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Test 1. Getting Started', canvas.width / 2, 60);
    
    // Results
    ctx.font = 'bold 48px Arial';
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);
    ctx.fillText(`${totalScore}/${maxPossibleScore}`, canvas.width / 2, 140);
    
    // Percentage
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${percentage}%`, canvas.width / 2, 180);
    
    // Participant info
    ctx.font = '20px Arial';
    ctx.fillText(`Participant: ${userName}`, canvas.width / 2, 230);
    ctx.fillText(`Date: ${formatDate(new Date())}`, canvas.width / 2, 260);
    ctx.fillText(`Score: ${totalScore} correct answers out of ${maxPossibleScore} total points`, canvas.width / 2, 290);
    
    // Footer
    ctx.font = '16px Arial';
    ctx.fillText('Quiz completed successfully', canvas.width / 2, 340);
    
    // Convert canvas to blob and download
    canvas.toBlob(function(blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = formatDate(new Date()).replace(/-/g, '_');
        a.download = `Test_1_Results_${userName.replace(/\s+/g, '_')}_${dateStr}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);
}

async function sendToGoogleSheets() {
    try {
        const completionDate = formatDate(new Date());
        const percentage = Math.round((totalScore / maxPossibleScore) * 100);
        
        // Prepare data for each question
        const rowsData = userAnswers.map(answer => ({
            participant: userName,
            date: completionDate,
            questionNumber: answer.questionNumber,
            question: answer.question,
            selectedAnswers: answer.selectedAnswers.join(', '),
            correctAnswers: answer.correctAnswers.join(', '),
            isCorrect: answer.isCorrect ? 'Yes' : 'No',
            pointsScored: answer.pointsScored,
            maxPoints: answer.maxPoints,
            totalScore: totalScore,
            maxPossibleScore: maxPossibleScore,
            percentage: percentage + '%'
        }));
        
        // Send data to Google Sheets via Google Apps Script
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addQuizResults',
                sheetName: 'Test 1. Gettings Started',
                data: rowsData
            })
        });
        
        console.log('Data sent to Google Sheets successfully');
    } catch (error) {
        console.error('Error sending data to Google Sheets:', error);
        // Don't show error to user as it might not affect their experience
    }
}