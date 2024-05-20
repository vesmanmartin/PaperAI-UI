import os
import json
from json.decoder import JSONDecodeError
from flask import Flask, render_template, request, jsonify
from langchain.chains import ConversationalRetrievalChain
from langchain.chains import QAGenerationChain
from langchain.prompts import PromptTemplate
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader, CSVLoader
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.embeddings import HuggingFaceEmbeddings

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Set the maximum file upload size to 100MB

documents = []
mul_document = []
chat_history = []
docsFolder = 'docs'
dbFolder = 'DB'


model_name = "embed_model/all-mpnet-base-v2"
model_kwargs = {"device": "cuda"}
encode_kwargs = {"normalize_embeddings": True}
embed_model = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs)
llm_model = Ollama(
    model='mixtral:latest',
    temperature='0.3',
    callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]))

# llm_model = Ollama(model = 'phi:latest')


def update_json(files, json_file):
    print(json_file)
    if not os.path.exists(json_file):
        data = {}
    else:
        with open(json_file, 'r') as f:
            data = json.load(f)

    # Find the last project key and increment the number
    last_project_key = None
    for key in data.keys():
        if key.startswith("project"):
            last_project_key = key
    if last_project_key:
        project_number = int(last_project_key.split("-")[-1]) + 1
        new_project_key = f"project {project_number}"
    else:
        new_project_key = "project-1"

    # Extract file names
    uploaded_files = [file.filename for file in files if file.filename.endswith(('.pdf', '.docx', '.doc', '.txt', '.csv'))]

    # Save file names under the new project key
    data[new_project_key] = uploaded_files

    # Update JSON file
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=4)
    
    return new_project_key
        
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_files')
def get_files():
    filenames = os.listdir(dbFolder)
    return jsonify(filenames)

def read_json(json_file):
    if not os.path.exists(json_file):
        return jsonify({"error": "JSON file not found"})
    
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
    except JSONDecodeError:
        return jsonify({"error": "Error decoding JSON file"}), 500
    print(data)
    return jsonify(data)

@app.route('/get_mul_files')
def get_mul_files():
    return read_json('projects.json')


@app.route('/upload', methods=['POST'])
def upload_files():
    global documents
    # Process uploaded files
    files = request.files.getlist('files[]')
   
    for file in files:
        if file.filename.endswith(('.pdf', '.docx', '.doc', '.txt', '.csv')):
            file_path = os.path.join('docs', file.filename)
            file.save(file_path)

            # Process the file based on its extension
            if file.filename.endswith('.pdf'):
                loader = PyPDFLoader(file_path)
            elif file.filename.endswith(('.docx', '.doc')):
                loader = Docx2txtLoader(file_path)
            elif file.filename.endswith('.txt'):
                loader = TextLoader(file_path)
            elif file.filename.endswith('.csv'):
                loader = CSVLoader(file_path)

            documents.extend(loader.load())

    # Split documents into chunks
    text_splitter = CharacterTextSplitter(chunk_size=10000, chunk_overlap=30)
    documents = text_splitter.split_documents(documents)

    if documents:
        vectordb = Chroma.from_documents(documents, embedding=embed_model, persist_directory="./DB/" + file.filename + "/")
        vectordb.persist()
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error'})


@app.route('/upload_multiple_files', methods=['POST'])
def upload_multiple_files():
    global mul_document
    mul_document.clear()
    # Process uploaded files
    files = request.files.getlist('mul-files[]')
    
    new_project_name = update_json(files, 'projects.json')

    for file in files:
        if file.filename.endswith(('.pdf', '.docx', '.doc', '.txt', '.csv')):
            file_path = os.path.join('docs', file.filename)
            file.save(file_path)

            # Process the file based on its extension
            if file.filename.endswith('.pdf'):
                loader = PyPDFLoader(file_path)
            elif file.filename.endswith(('.docx', '.doc')):
                loader = Docx2txtLoader(file_path)
            elif file.filename.endswith('.txt'):
                loader = TextLoader(file_path)
            elif file.filename.endswith('.csv'):
                loader = CSVLoader(file_path)

            mul_document.extend(loader.load())
            
    # Split documents into chunks
    text_splitter = CharacterTextSplitter(chunk_size=10000, chunk_overlap=30)
    mul_document = text_splitter.split_documents(mul_document)

    # Create vector database
    if mul_document:
        vectordb = Chroma.from_documents(mul_document, embedding=embed_model, persist_directory= dbFolder + "/" + new_project_name + "/")
        vectordb.persist()
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error'})
    
source_document_number = 0
@app.route('/chat', methods=['POST'])
def chat():
    global source_document_number
    print(request.json)
    query = request.json['query']
    filename = request.json['selectedFile']
    # source_document_number += 1
    # source_documents = f"Generative AI (GenAI) is a type of Artificial Intelligence that can create a wide variety of data, such as images, videos, audio, text, and 3D models. Source document {source_document_number}"
    # return jsonify({
    #     'answer': 'answer of your question',
    #     'source_documents': source_documents
    # })
    vectordb = Chroma(persist_directory="./DB/" + filename, embedding_function=embed_model)

    # Check if vectordb is empty
    if not vectordb:  # Replace with actual check
        result = {"answer": "No documents have been uploaded yet. Please upload some documents to get started."}
        chat_history.append((query, result["answer"]))
        return jsonify(result)

    retriever = vectordb.as_retriever(search_kwargs={'k': 1})
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm_model,
        retriever=retriever,
        return_source_documents=True,
        verbose=True,
    )

    result = qa_chain.invoke({"question": query, "chat_history": chat_history})
    chat_history.append((query, result["answer"]))
    print("result................")
    print(result)

    for doc in result.get('source_documents', []):
        print(f"Page Content: {doc.page_content}")
        print(f"Metadata: {doc.metadata}")

    def document_to_dict(doc):
        # Convert Document object to dict
        return {
            'page_content': doc.page_content,
            'metadata': doc.metadata
        }

    return jsonify({
        'question': result['question'],
        'chat_history': result['chat_history'],
        'answer': result['answer'],
        'source_documents': [document_to_dict(doc) for doc in result['source_documents']]
    })
    
   


@app.route('/delete', methods=['POST'])
def delete_file():
    data = request.json
    #filename = request.form['filename']
    filename = data['filename']
    filepath = os.path.join(docsFolder, filename)
    db_path = os.path.join(dbFolder, filename)  # Path to corresponding folder in DB
    print(db_path)

    if os.path.exists(filepath):
        os.remove(filepath)
        # Delete the corresponding folder in DB if it exists
        if os.path.exists(db_path):
            import shutil
            shutil.rmtree(db_path)
        return jsonify({'status': 'success', 'message': f'File "{filename}" deleted successfully'})
    else:
        return jsonify({'status': 'error', 'message': f'File "{filename}" not found'})


# Function to delete JSON pair by key
def delete_pair_by_key(json_file, key):
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: JSON file not found.")
        return False
    
    if key in data:
        del data[key]
        with open(json_file, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Pair with key '{key}' deleted successfully.")
        return True
    else:
        print(f"Key '{key}' not found.")
        return False

@app.route('/delete_mul', methods=['POST'])
def delete_mul_file():
    data = request.json
    #filename = request.form['filename']
    filename = data['filename']
    db_path = os.path.join(dbFolder, filename)  # Path to corresponding folder in DB
    print(db_path)
    # Delete the corresponding folder in DB if it exists
    if os.path.exists(db_path):
        import shutil
        shutil.rmtree(db_path)
        # Usage example
        delete_pair_by_key('projects.json', 'project-1')
        return jsonify({'status': 'success', 'message': f'File "{filename}" deleted successfully'})
    else:
        return jsonify({'status': 'error', 'message': f'File "{filename}" not found'})
    

if __name__ == '__main__':
    app.run(debug=True, host="127.0.0.1", port=5002)