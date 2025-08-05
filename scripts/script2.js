const questions = [
    {
        question: "Which support unit is responsible for connecting our CRM with external software?",
        answers: ["Integrations", "L1", "L2", "Onboarding"],
        correct: [0], // Integrations
        type: "multiple-choice"
    },
    {
        question: "Who do you contact in case you come across a case you're unfamiliar with and cannot find information in Notion?",
        answers: ["L2", "Onboarding", "Integrations", "Shift lead"],
        correct: [0], // L2
        type: "multiple-choice"
    },
    {
        question: "According to our \"L1 to Integrations escalation\" procedure, which of these cases needs to be transferred to the Integrations team?",
        answers: ["New Brand integration", "Postback integration", "Sending a test lead for an existing integration"],
        correct: [0], // New Brand integration
        type: "multiple-choice"
    },
    {
        question: "Please align the shift types with their time frames",
        type: "shift-alignment",
        shifts: ["Day shift", "Evening shift", "Weekend day shift", "Weekend evening shift"],
        times: ["from 9:30 to 18:00 GMT+3", "from 15:30 to 0:00 GMT+3", "from 9:30 to 17:00 GMT+3", "from 16:30 to 0:00 GMT+3"],
        correct: {
            "Day shift": "from 9:30 to 18:00 GMT+3",
            "Evening shift": "from 15:30 to 0:00 GMT+3",
            "Weekend day shift": "from 9:30 to 17:00 GMT+3",
            "Weekend evening shift": "from 16:30 to 0:00 GMT+3"
        }
    },
    {
        question: "Which channel must be used when we want to transfer data at the end of the shift?",
        answers: ["#shift_data", "#support_chat", "#support", "#general"],
        correct: [0], // #shift_data
        type: "multiple-choice"
    },
    {
        question: "Please describe your actions at the start of the Day Shift",
        type: "long-answer"
    },
    {
        question: "There is a power outage in your house, and it's your shift today. Please describe your actions.",
        type: "long-answer"
    },
    {
        question: "What are the correct steps for going on a break?",
        type: "long-answer"
    },
    {
        question: "Please describe what is IQS",
        type: "long-answer"
    },
    {
        question: "A Client is asking you to make edits in his Rotation. What will you do?",
        answers: ["Will inform the Client that we cannot make any changes in the Rotation Control", "Will provide a detailed guide how the Client can do it himself", "Will make changes in the Rotation according to the Client's request"],
        correct: [0, 1], // First two options
        type: "multiple-choice"
    },
    {
        question: "Which of the following we CANNOT do?",
        answers: ["Mention names of Brands and Affiliates in the chats", "Download data from inactive CRMs", "Map Sale Statuses for Clients", "Send test leads as per the Client's request", "Add new funnels for the Clients"],
        correct: [0, 1, 2], // First three options
        type: "multiple-choice"
    },
    {
        question: "The Client is asking to send a screenshot of the Rotation Control in the chat. What will you do?",
        type: "long-answer"
    },
    {
        question: "Please name the people you can contact in case of any issues from OX",
        type: "long-answer"
    },
    {
        question: "You are on the weekend shift, and Diamond is asking to create a new user in their CRM. Will you do it and why?",
        type: "long-answer"
    },
    {
        question: "You find a small bug which affects all clients' CRMs. Should you alert it, and where?",
        type: "long-answer"
    },
    {
        question: "Holidays time - you and all your colleagues from the team submitted a day off for Christmas Day. Thus, no available people are left to be on shift. What can be done?",
        type: "long-answer"
    },
    {
        question: "You see that the client is telling that things are slow and is tagging our CEO, Eli Vaksman, telling him he is leaving IREV. What is the best you can do?",
        type: "long-answer"
    },
    {
        question: "A premium client asks for your personal details as he wants to share something privately. What will you do?",
        type: "long-answer"
    }
];

let currentQuestionIndex = 0;
let totalScore = 0;
let maxPossibleScore = 0;
let selectedAnswers = [];
let userName = '';
let answered = false;
let userAnswers = []; // Store all user answers for Google Sheets
let longAnswerText = '';
let shiftAlignmentAnswers = {};

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
    if (q.type === 'multiple-choice') {
        maxPossibleScore += q.correct.length;
    } else if (q.type === 'shift-alignment') {
        maxPossibleScore += Object.keys(q.correct).length;
    } else if (q.type === 'long-answer') {
        maxPossibleScore += 1; // Long answers get 1 point (manual review)
    }
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
    longAnswerText = '';
    shiftAlignmentAnswers = {};
    answered = false;
    
    if (question.type === 'multiple-choice') {
        showMultipleChoiceQuestion(question, answersContainer);
    } else if (question.type === 'long-answer') {
        showLongAnswerQuestion(answersContainer);
    } else if (question.type === 'shift-alignment') {
        showShiftAlignmentQuestion(question, answersContainer);
    }
    
    document.getElementById('submitBtn').classList.remove('hidden');
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('feedback').classList.remove('show');
}

function showMultipleChoiceQuestion(question, container) {
    question.answers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        answerDiv.onclick = () => toggleAnswer(index);
        
        answerDiv.innerHTML = `
            <input type="checkbox" class="answer-checkbox" id="answer${index}">
            <label class="answer-text" for="answer${index}">${answer}</label>
        `;
        
        container.appendChild(answerDiv);
    });
}

function showLongAnswerQuestion(container) {
    const longAnswerDiv = document.createElement('div');
    longAnswerDiv.className = 'long-answer-container';
    
    longAnswerDiv.innerHTML = `
        <textarea 
            class="long-answer-textarea" 
            id="longAnswerTextarea"
            placeholder="Please provide your detailed answer here..."
            oninput="updateLongAnswer()"
        ></textarea>
    `;
    
    container.appendChild(longAnswerDiv);
}

function showShiftAlignmentQuestion(question, container) {
    const alignmentDiv = document.createElement('div');
    alignmentDiv.className = 'shift-alignment-container';
    
    // Shuffle the times to make it more challenging
    const shuffledTimes = [...question.times].sort(() => Math.random() - 0.5);
    
    let tableHTML = `
        <table class="shift-alignment-table">
            <thead>
                <tr>
                    <th>Shift Type</th>
                    ${shuffledTimes.map(time => `<th>${time}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;
    
    question.shifts.forEach(shift => {
        tableHTML += `<tr><td>${shift}</td>`;
        shuffledTimes.forEach(time => {
            const radioId = `shift_${shift.replace(/\s+/g, '_')}_${time.replace(/[^a-zA-Z0-9]/g, '_')}`;
            tableHTML += `
                <td class="shift-cell">
                    <input 
                        type="radio" 
                        name="shift_${shift.replace(/\s+/g, '_')}" 
                        class="shift-radio" 
                        id="${radioId}"
                        onchange="updateShiftAlignment('${shift}', '${time}')"
                    >
                </td>
            `;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    alignmentDiv.innerHTML = tableHTML;
    container.appendChild(alignmentDiv);
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

function updateLongAnswer() {
    if (answered) return;
    longAnswerText = document.getElementById('longAnswerTextarea').value;
}

function updateShiftAlignment(shift, time) {
    if (answered) return;
    shiftAlignmentAnswers[shift] = time;
}

function submitAnswer() {
    const question = questions[currentQuestionIndex];
    
    // Validation
    if (question.type === 'multiple-choice' && selectedAnswers.length === 0) {
        alert('Please select at least one answer.');
        return;
    }
    
    if (question.type === 'long-answer' && !longAnswerText.trim()) {
        alert('Please provide an answer.');
        return;
    }
    
    if (question.type === 'shift-alignment' && Object.keys(shiftAlignmentAnswers).length !== question.shifts.length) {
        alert('Please align all shift types with their time frames.');
        return;
    }
    
    answered = true;
    
    // Disable all inputs
    disableInputs(question);
    
    // Calculate score and store answer data
    let correctAnswers = 0;
    let answerData = {
        questionNumber: currentQuestionIndex + 1,
        question: question.question,
        type: question.type
    };
    
    if (question.type === 'multiple-choice') {
        selectedAnswers.forEach(index => {
            if (question.correct.includes(index)) {
                correctAnswers++;
            }
        });
        
        answerData.selectedAnswers = selectedAnswers.map(index => question.answers[index]);
        answerData.correctAnswers = question.correct.map(index => question.answers[index]);
        answerData.maxPoints = question.correct.length;
        
        // Show visual feedback
        question.answers.forEach((answer, index) => {
            const option = document.querySelector(`#answer${index}`).parentElement;
            if (question.correct.includes(index)) {
                option.classList.add('correct');
            } else if (selectedAnswers.includes(index)) {
                option.classList.add('incorrect');
            }
        });
        
    } else if (question.type === 'shift-alignment') {
        Object.keys(shiftAlignmentAnswers).forEach(shift => {
            if (question.correct[shift] === shiftAlignmentAnswers[shift]) {
                correctAnswers++;
            }
        });
        
        answerData.selectedAnswers = Object.entries(shiftAlignmentAnswers).map(([shift, time]) => `${shift}: ${time}`);
        answerData.correctAnswers = Object.entries(question.correct).map(([shift, time]) => `${shift}: ${time}`);
        answerData.maxPoints = Object.keys(question.correct).length;
        
        // Show visual feedback
        Object.keys(shiftAlignmentAnswers).forEach(shift => {
            const selectedTime = shiftAlignmentAnswers[shift];
            const correctTime = question.correct[shift];
            const radioId = `shift_${shift.replace(/\s+/g, '_')}_${selectedTime.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const cell = document.getElementById(radioId).parentElement;
            
            if (selectedTime === correctTime) {
                cell.classList.add('correct');
            } else {
                cell.classList.add('incorrect');
            }
        });
        
    } else if (question.type === 'long-answer') {
        correctAnswers = 1; // Long answers always get 1 point (manual review)
        answerData.selectedAnswers = [longAnswerText];
        answerData.correctAnswers = ['Manual review required'];
        answerData.maxPoints = 1;
    }
    
    answerData.pointsScored = correctAnswers;
    answerData.isCorrect = correctAnswers === answerData.maxPoints;
    userAnswers.push(answerData);
    
    // Add points to total score
    totalScore += correctAnswers;
    
    // Show feedback
    const feedbackScore = document.getElementById('feedbackScore');
    if (question.type === 'long-answer') {
        feedbackScore.textContent = 'Your answer has been recorded and will be reviewed manually.';
    } else {
        feedbackScore.textContent = `You scored ${correctAnswers} out of ${answerData.maxPoints} points for this question.`;
    }
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

function disableInputs(question) {
    if (question.type === 'multiple-choice') {
        const allOptions = document.querySelectorAll('.answer-option');
        const allCheckboxes = document.querySelectorAll('.answer-checkbox');
        
        allOptions.forEach(option => {
            option.classList.add('disabled');
            option.onclick = null;
        });
        
        allCheckboxes.forEach(checkbox => {
            checkbox.disabled = true;
        });
    } else if (question.type === 'long-answer') {
        const textarea = document.getElementById('longAnswerTextarea');
        textarea.disabled = true;
        textarea.classList.add('disabled');
    } else if (question.type === 'shift-alignment') {
        const allRadios = document.querySelectorAll('.shift-radio');
        allRadios.forEach(radio => {
            radio.disabled = true;
        });
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
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Test 2. Policies & Procedures', canvas.width / 2, 60);
    
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
        a.download = `Test_2_Results_${userName.replace(/\s+/g, '_')}_${dateStr}.jpg`;
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
            questionType: answer.type,
            selectedAnswers: Array.isArray(answer.selectedAnswers) ? answer.selectedAnswers.join(' | ') : answer.selectedAnswers,
            correctAnswers: Array.isArray(answer.correctAnswers) ? answer.correctAnswers.join(' | ') : answer.correctAnswers,
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
                sheetName: 'Test2',
                data: rowsData
            })
        });
        
        console.log('Data sent to Google Sheets successfully');
    } catch (error) {
        console.error('Error sending data to Google Sheets:', error);
        // Don't show error to user as it might not affect their experience
    }
}