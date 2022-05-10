// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const decorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'green',
	border: '2px solid white',
})

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('shopify-get-github-link-to-selection.getGitHubUrl', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		var gitAPI = getBuiltInGitApi();
		if (!gitAPI) {
			return; // No git api
		}
		
		var fullPath = vscode.window.activeTextEditor?.document.uri.fsPath;
		if (!fullPath) {
			return;
		}

		const repo = gitAPI.repositories[0];
		const head = repo.state.HEAD;
		const remote = repo.state.remotes[0];

		if (!remote) {
			return;
		}

		var baseUrl = remote.fetchUrl.replace(/\.[^/.]+$/, '');
		var commit = head.commit;
		var relativePath = vscode.workspace.asRelativePath(fullPath);
		var diffWithHead = await repo.diffWithHEAD();
		var currentFileDiffed = false;

		diffWithHead.forEach((diffedFile: { uri: { path: string | undefined; }; }) => {
			if (diffedFile.uri.path === fullPath){
				currentFileDiffed = true;
				return;
			}
		});

		if (currentFileDiffed) {
			vscode.window.showInformationMessage('This file has unstaged git changes. You can\'t copy a link to it until you\'ve committed your changes to the remote.');
			return;
		}

		var selection = editor.selection;
		var start =  selection.start.line  + 1;
		var end = selection.end.line + 1;
		
		var remoteURL = baseUrl + '/blob/' + commit + '/' + relativePath + '#L' + start + '-L' + end; 

		vscode.window.showInformationMessage('Copied GitHub link to line range: ' + start + ' - ' + end);
	    vscode.env.clipboard.writeText(remoteURL);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getBuiltInGitApi(){
    try {
        const extension = vscode.extensions.getExtension('vscode.git');
        if (extension !== undefined) {
            const gitExtension = extension.isActive ? extension.exports : extension.activate();

            return gitExtension.getAPI(1);
        }
    } catch {}

    return undefined;
}