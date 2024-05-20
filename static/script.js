const fileList = document.getElementById("file-list");
const chatHistory = document.getElementById("chat-history");
const chatInput = document.getElementById("chat-input");
const chatForm = document.getElementById("chat-form");
const uploadForm = document.getElementById("upload-form");
const upload_multiple_files_form = document.getElementById("upload-multiple-files");


document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_files')
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('file-list');
            data.forEach(filename => {
                if(filename.startsWith("project")){
                  console.log(filename);
                }
                else{
               
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'selectedFile';
                radioInput.value = filename;
                radioInput.id = filename; // Convert project name to lowercase and replace spaces with hyphens

                const label = document.createElement('label');
                label.textContent = filename;
                label.htmlFor = filename;

                const deleteButton = document.createElement('button');
                deleteButton.innerHTML=`<i class="fa fa-trash" aria-hidden="true"></i>`;
                deleteButton.classList.add("btn-delete");

                deleteButton.onclick = function() {
                    deleteFile(filename);
                };
              
                const radioItem = document.createElement('div');
                  radioItem.classList.add('radio-item');
                  radioItem.appendChild(radioInput);
                  radioItem.appendChild(label);
                  radioItem.appendChild(deleteButton);
                  

                  fileList.appendChild(radioItem);
              }
            });
        })
        .catch(error => console.error('Error:', error));

      
        fetch('/get_mul_files')
        .then(response => response.json())
        .then(data => {
           
            // Function to create radio buttons for each project
            if (data.hasOwnProperty('error')) {
              // Handle error condition
              console.log('Error:', data.error);
              const projectsDiv = document.getElementById('projects');
              projectsDiv.textContent=data.error
              // Add your error handling code here
          } else {
              // Function to create radio buttons for each project
              function createRadioButtons(data) {
                  const projectsDiv = document.getElementById('projects');
                  for (const key in data) {
                      if (data.hasOwnProperty(key)) {
                          // Create radio button
                          const radioInput = document.createElement('input');
                          radioInput.type = 'radio';
                          radioInput.name = 'selectedFile';
                          radioInput.value = key;
                          radioInput.id = key.replace(/\s+/g, '-').toLowerCase(); // Convert project name to lowercase and replace spaces with hyphens
      
                          const label = document.createElement('label');
                          label.textContent = key;
                          label.htmlFor = key.replace(/\s+/g, '-').toLowerCase();
      
                          const deleteButton = document.createElement('button');
                          deleteButton.innerHTML = `<i class="fa fa-trash" aria-hidden="true"></i>`;
                          deleteButton.classList.add("btn-delete");
      
                          deleteButton.onclick = function () {
                              deleteMulFile(key);
                          };
      
                          const fileList = document.createElement('ul');
                          data[key].forEach(file => {
                              const listItem = document.createElement('li');
                              listItem.textContent = file;
                              listItem.classList.add("ulist-group-item");
                              fileList.appendChild(listItem);
                          });
      
                          const radioItem = document.createElement('div');
                          radioItem.classList.add('radio-item');
                          radioItem.appendChild(radioInput);
                          radioItem.appendChild(label);
                          radioItem.appendChild(deleteButton);
                          radioItem.appendChild(fileList);
      
                          projectsDiv.appendChild(radioItem);
                      }
                  }
              }
      
              // Call the function with sample JSON data
              createRadioButtons(data);
          }
      })
      .catch(error => console.error('Error:', error));
  });
// Handle file uploads
uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(uploadForm);
  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        // Clear the file list
        //fileList.innerHTML = "";
        // Update the file list
        const files = uploadForm.elements["files[]"].files;
        for (let i = 0; i < files.length; i++) {
          const li = document.createElement("li");
          li.textContent = files[i].name;
          li.classList.add("list-group-item");
          const deleteBtn = document.createElement("button");
          deleteBtn.innerHTML = `<i class="fa fa-trash" aria-hidden="true"></i>`;
          deleteBtn.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
          deleteBtn.addEventListener("click", () =>
            deleteFile(files[i].name)
          );
          li.appendChild(deleteBtn);
          fileList.appendChild(li);
        }
      }
    })
    .catch((error) => console.error("Error:", error));
});

upload_multiple_files_form.addEventListener("submit", (e) => {
  console.log("form mul file upload called");
  e.preventDefault();
  const formData = new FormData(upload_multiple_files_form);
  fetch("/upload_multiple_files", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.status === "success") {
        // // Clear the file list
        // //fileList.innerHTML = "";
        // // Update the file list
        // const files = uploadForm.elements["files[]"].files;
        // for (let i = 0; i < files.length; i++) {
        //   const li = document.createElement("li");
        //   li.textContent = files[i].name;
        //   li.classList.add("list-group-item");
        //   const deleteBtn = document.createElement("button");
        //   deleteBtn.innerHTML = `<i class="fa fa-trash" aria-hidden="true"></i>`;
        //   deleteBtn.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
        //   deleteBtn.addEventListener("click", () =>
        //     deleteFile(files[i].name)
        //   );
        //   li.appendChild(deleteBtn);
        //   fileList.appendChild(li);
        // }
      }
    })
    .catch((error) => console.error("Error:", error));
});


// Handle file deletion
function deleteFile(filename) {
    console.log("---------delete called----------")
  fetch("/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        // Remove the file from the file list
        const fileListItems = fileList.getElementsByTagName("li");
        for (let i = 0; i < fileListItems.length; i++) {
          if (fileListItems[i].textContent.includes(filename)) {
            fileList.removeChild(fileListItems[i]);
            break;
          }
        }
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Handle file deletion
function deleteMulFile(filename) {
  console.log("---------delete called----------")
fetch("/delete_mul", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ filename }),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.status === "success") {
      // Remove the file from the file list
      const fileListItems = fileList.getElementsByTagName("li");
      for (let i = 0; i < fileListItems.length; i++) {
        if (fileListItems[i].textContent.includes(filename)) {
          fileList.removeChild(fileListItems[i]);
          break;
        }
      }
    }
  })
  .catch((error) => console.error("Error:", error));
}

// Handle chat messages
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const selectedRadioBtn = document.querySelector('input[name="selectedFile"]:checked');

  let selectedValue = null;
  if (selectedRadioBtn) {
      selectedValue = selectedRadioBtn.value;
  } else {
      console.log('No file selected');
      return; // Exit function if no file selected
  }
  const query = chatInput.value.trim();
  const userMessage = document.createElement("div");
        userMessage.textContent = "You: " + query;
        userMessage.classList.add("chat-message", "user");
        chatHistory.appendChild(userMessage);
  if (query) {
    // Send the chat message to the server
    fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query : query , selectedFile : selectedValue })
    })
      .then((response) => response.json())
      .then((data) => {
        // Display the chat history
        

        const assistantMessage = document.createElement("div");
        assistantMessage.textContent = "Assistant: " + data.answer;
        assistantMessage.classList.add("chat-message", "assistant");
        chatHistory.appendChild(assistantMessage);

        // Display the source documents
       // if (data.source_documents) {
         // data.source_documents.forEach((sourceDocument) => {
            //const sourceMessage = document.createElement("div");
            //sourceMessage.textContent = `Source: ${sourceDocument.metadata.source} (Page ${sourceDocument.metadata.page})\n${sourceDocument.page_content}`;
            //sourceMessage.textContent = "Source:"+ data.source_documents;
            //sourceMessage.classList.add("chat-message", "source");
            // var source = JSON.stringify(data.source_documents)
            var source = data.source_documents[0]['metadata']['source']
            var source2=data.source_documents[0]['page_content']
            console.log(source);

            var messageContainer = document.createElement('div');
            messageContainer.className = 'message';
            var responseButtonContainer = document.createElement('div');
            var responseContainer = document.createElement('div');
            responseContainer.className = 'response-container';
            var responseButton = document.createElement('button');
            responseButton.className = 'btn response-button';
            responseButton.setAttribute('data-message', source+source2);
            responseButton.onclick = openNavR; // Set onclick attribute to openNavR function
            var slide=document.getElementById('mySidenavR');
            slide.style.display='block';
            responseButton.innerHTML = '<i class="fa fa-info-circle" aria-hidden="true"></i>';
            responseContainer.appendChild(responseButton);
            responseButtonContainer.appendChild(responseContainer);
            messageContainer.appendChild(responseButtonContainer);
            chatHistory.appendChild(messageContainer);
            var br = document.createElement('br');
            var br2 = document.createElement('br');
            messageContainer.appendChild(br);
            messageContainer.appendChild(br2);

         // });
        //} else {
         // const sourceMessage = document.createElement("div");
         // sourceMessage.textContent = "Source: Language Model";
         // sourceMessage.classList.add("chat-message", "source");
         // chatHistory.appendChild(sourceMessage);
        //}

        chatInput.value = "";
        chatHistory.scrollTop = chatHistory.scrollHeight;
      })
      .catch(function (error) {
        console.error("Error:", error);
      });
  }
});

const scrollableElement = document.querySelector(".scroll");

// Function to scroll to the bottom of the scrollable element
function scrollToBottom() {
  scrollableElement.scrollTop = scrollableElement.scrollHeight;
}

// Create a new instance of MutationObserver
const observer = new MutationObserver(scrollToBottom);

// Configuration object for the observer
const config = { childList: true, subtree: true };

// Start observing the scrollable element for changes
observer.observe(scrollableElement, config);


$(document).on('click', '.response-button', function () {
  var response = $(this).data('message');
  console.log(response)
  $('.responseSlide').html(response);
  $('.responseSlideContainer').addClass('show');
  document.getElementById("mySidenavR").style.width = "250px";
  console.log("-------------------")

});

// Event listener for clicking on close button
$(document).on('click', '.close-slide-button', function () {
  $('.responseSlideContainer').removeClass('show');
});

// toggle 

const singleUploadDiv = document.getElementById('single-upload');
const multipleUploadDiv = document.getElementById('multiple-upload');
const singleUploadForm = document.getElementById('upload-form');
const multipleUploadForm = document.getElementById('upload-multiple-files');
const toggleBtn = document.getElementById('toggle-btn');

singleUploadForm.addEventListener('submit', function(event) {
  event.preventDefault();
  // Handle single file upload logic here
  console.log('Uploading single file');
});

multipleUploadForm.addEventListener('submit', function(event) {
  event.preventDefault();
  // Handle multiple files upload logic here
  console.log('Uploading multiple files');
});

// Function to toggle between single and multiple upload forms
function toggleUploadForm(type) {
  if (type === 'single') {
    singleUploadDiv.style.display = 'block';
    multipleUploadDiv.style.display = 'none';
    toggleBtn.textContent = 'Upload multiple files';
  } else if (type === 'multiple') {
    singleUploadDiv.style.display = 'none';
    multipleUploadDiv.style.display = 'block';
    toggleBtn.textContent = 'Upload single file';
  }
}

// Initially show single upload form
toggleUploadForm('single');
// Toggle button event listener
toggleBtn.addEventListener('click', function() {
  if (singleUploadDiv.style.display === 'none') {
    toggleUploadForm('single');
  } else {
    toggleUploadForm('multiple');
  }
});



function openNavR() {
  document.getElementById("mySidenavR").style.width = "250px";


  document.getElementById("mySidenavR").style.display = 'block';
  document.getElementById("col-md-8").className = "col-md-7 bg-dark text-light min-vh-100 p-4";
  console.log('**************************')
}

function closeNavR() {
  document.getElementById("mySidenavR").style.width = "0px";
  setTimeout(function() {
    document.getElementById("mySidenavR").style.display = 'none';
  }, 300); 
  document.getElementById("col-md-8").className = "col-md-9 bg-dark text-light min-vh-100 p-4";

}