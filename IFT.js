function generateUUID() {
    let d = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

resumeObject = {
    id: generateUUID()
};

// internal fine tuning javascript to replicate what is in webflow
// const rebuildButton = document.getElementById("rebuild_button")
// rebuildButton.style.display = "none"
function alignBullets(leftBullets, rightBullets) {
    const container = document.getElementById('diff_checker');
    for (let i = 0; i < leftBullets.count; i++) {
        const block = document.createElement('div');
        block.className = 'resume-text-block';
        block.id = 'block-' + i; // Assign a unique ID to each block
        block.style.display = 'none'; // Initially hide the block

        const leftBulletDiv = document.createElement('div');
        leftBulletDiv.className = 'resume-text-side';
        leftBulletDiv.innerHTML = leftBullets.html[i];

        const rightBulletDiv = document.createElement('div');
        rightBulletDiv.className = 'resume-text-side';
        rightBulletDiv.innerHTML = rightBullets.html[i];

        const rightTextBox = document.createElement('textarea');
        rightTextBox.id = 'right-textbox-' + i;
        rightTextBox.value = extractTextFromHTML(rightBullets.html[i]);
        rightTextBox.classList.add('edit-bullet');
        rightBulletDiv.appendChild(rightTextBox);

        block.appendChild(leftBulletDiv);
        block.appendChild(rightBulletDiv);
        container.appendChild(block);
    }
}


function parseBullets(text) {
    const bullets = text.split(/\\n\s?/)
        .filter(bullet => bullet.trim() !== '')  // Removes bullets that are just whitespace or empty
        .filter(bullet => bullet.split(' ').length > 4)  // Removes bullets with fewer than 5 words
        .filter(bullet => /[a-zA-Z]/.test(bullet));  // Ensures the bullet has at least one alphabetic character

    return {
        html: bullets,
        count: bullets.length
    };
};

function extractTextFromHTML(htmlString) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText; // Use textContent for better compatibility across browsers, fallback to innerText if needed
}

async function readTextFile(file) {
    let response = await fetch(file);
    if (response.ok) {
        let text = await response.text();
        return text;
    } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
}

// This is where the main operations take place
document.addEventListener('sessionStorageReady', async function (e) {
    // document.getElementById("resume-form").style.display = "none"
    // document.getElementById("resumeai_success").style.display = "block"
    // document.getElementById("loading-section").style.display = "none"
    document.getElementById("diff_checker").style.display = "block"

    // let oldText = await readTextFile("../files/oldText_data.txt");
    // let newText = await readTextFile("../files/newText_data.txt");

    console.log('Received custom event:', e.detail.message);

    
    let oldText = sessionStorage.getItem("oldText");
    let newText = sessionStorage.getItem("newText");
    let keywords = sessionStorage.getItem("keywords");
    // After fetching, clear them from the sessionStorage
    sessionStorage.removeItem("oldText");
    sessionStorage.removeItem("newText");
    sessionStorage.removeItem("keywords");

    let keywords_display = keywords.replace(/,/g, ',  ');
    // keywords = JSON.parse(keywords);
    resumeObject.keywords = keywords;
    console.log(keywords);
    document.getElementById('keyword_text').textContent = keywords_display;

    let oldText2 = oldText.replace(/\n/g, ' \\n ');
    let newText2 = newText.replace(/\n/g, ' \\n ');

    document.getElementById('diff_checker_block').style.display = "flex"


    // Get the differences
    const diff = Diff.diffWords(oldText2, newText2);

    // Variables to count the changes
    let addedCount = 0;
    let removedCount = 0;

    // Generate HTML output to highlight the changes
    let displayTextLeft = '';
    let displayTextRight = '';
    diff.forEach((part) => {
        // Green for additions, red for deletions, no background for common parts
        const bgColor = part.added ? 'rgba(67, 232, 177, .48)' :
            part.removed ? 'rgba(255, 51, 116, .5)' : 'none';

        let text = `<span style="background-color:${bgColor}">${part.value}</span>`;

        if (part.added) {
            displayTextRight += text;
            addedCount++;
        } else if (part.removed) {
            displayTextLeft += text;
            removedCount++;
        } else {
            // Append to both sides if the text is unchanged
            displayTextLeft += text;
            displayTextRight += text;
        }
    });

    const leftBullets = parseBullets(displayTextLeft);
    console.log("Left Bullets:", leftBullets);

    const rightBullets = parseBullets(displayTextRight);
    console.log("Right Bullets:", rightBullets);

    alignBullets(leftBullets, rightBullets)

    // Output the highlighted text
    document.getElementById('changed_text').innerText = `ResumeAI found ${addedCount} optimizations for the ATS`
    console.log(`ResumeAI removed ${removedCount}`);
    console.log(`ResumeAI found ${addedCount} optimizations for the ATS`);



    // beginning of voting handling -  - - - - - - - - -  - - - - -- - - -- - - -  - - - - - - - - 



    // Function to strip HTML tags from text
    const extractText = (htmlString) => {
        let tempElement = document.createElement("div");
        tempElement.innerHTML = htmlString;
        return tempElement.textContent || tempElement.innerText || "";
    };

    let current_index = 0; // Index to track current paragraph
    let good_votes = {};
    let bad_votes = {};
    let mission_votes = {};
    const updateContent = () => {
        if (current_index > 0) {
            // Hide the previous bullet
            document.getElementById('block-' + (current_index - 1)).style.display = 'none';
        }
        // if there are stll bullets to show
        if (current_index < leftBullets.count && current_index < rightBullets.count) {
            // Show the current bullet pair
            document.getElementById('block-' + current_index).style.display = 'flex';
            console.log(resumeObject);

        // if there are no more bullets to show
        } else {
            // Hide "bad_vote", "null_vote", and "good_vote"
            document.getElementById('bad_vote').style.display = 'none';
            document.getElementById('null_vote').style.display = 'none';
            document.getElementById('good_vote').style.display = 'none';
            // Show "voting_done" as flex
            document.getElementById('voting_done').style.display = 'flex';
            
            console.log(resumeObject);
            console.log(good_votes);
            console.log(bad_votes);
        }
    };

    // Initially populate the content
    updateContent();


    // The element id for the mission button is "mission_vote"

    // Add event listeners to the "good_vote" and "bad_vote" buttons
    document.getElementById('good_vote').addEventListener('click', () => {
        // Check if the right bullet's textarea has been edited
        const rightTextValue = document.getElementById('right-textbox-' + current_index).value;
        const originalRightText = extractTextFromHTML(rightBullets.html[current_index]);
        const rightValueToSave = (rightTextValue !== originalRightText) ? rightTextValue : originalRightText;
        // Store the current pair of paragraphs in the good_votes object
        good_votes[current_index] = {
            left: extractTextFromHTML(leftBullets.html[current_index]),
            right: rightValueToSave
        };
        resumeObject.good_votes = good_votes;
        current_index++;
        updateContent();
    });
    document.getElementById('null_vote').addEventListener('click', () => {
        current_index++;
        updateContent();
    });
    document.getElementById('bad_vote').addEventListener('click', () => {
        // Store the current pair of paragraphs in the bad_votes object
        bad_votes[current_index] = {
            left: extractTextFromHTML(leftBullets.html[current_index]),
            right: extractTextFromHTML(rightBullets.html[current_index])
        };
        current_index++;
        resumeObject.bad_votes = bad_votes;
        updateContent();
    });
    document.getElementById('mission_vote').addEventListener('click', () => {
        // Store the text in the mission object
        mission_votes[current_index] = {
            left: extractTextFromHTML(leftBullets.html[current_index]),
            right: extractTextFromHTML(rightBullets.html[current_index])
        };
        current_index++;
        resumeObject.mission_votes = mission_votes;
        updateContent();
    });

    // Doug, this is the function that sends the data
    function call_rlhf_backend(resumeObject) {
        fetch("https://rqga4d4m82.execute-api.us-east-2.amazonaws.com/beta_stage2/rlhf_system", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resumeObject }), // ADDED MISSION VOTES, TODO: HANDLE
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    // Add an event listener for "voting_done"
    document.getElementById('voting_done').addEventListener('click', () => {
        console.log(resumeObject);

        call_rlhf_backend(resumeObject)

        if (rebuildButton) {
            rebuildButton.style.display = 'flex';
        }
    });

});

