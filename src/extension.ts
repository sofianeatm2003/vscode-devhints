'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import DevHints from './devHints';
import * as path from 'path';
import * as os from 'os';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "devhints" is now active!');

    const baseUrl = vscode.workspace.getConfiguration("devhints").get("base_url", "https://devhints.io");
    const cacheDir = path.join(os.homedir(), '.config', 'Code');

    const devhintsService = new DevHints(baseUrl, cacheDir);

    vscode.workspace.onDidChangeConfiguration(event => {
        let affected = event.affectsConfiguration("devhints.base_url");
        if (affected) {
            console.log('Refreshing base url');
            devhintsService.setBaseUrl(vscode.workspace.getConfiguration("devhints").get("base_url", "https://devhints.io"));
            devhintsService.clearCache();
        }
    })

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.search', () => search(devhintsService))
    );

    context.subscriptions.push(vscode.commands.registerCommand('extension.clearCache', () => {
        devhintsService.clearCache();
        vscode.window.showInformationMessage("DevHints cache cleared.");
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {}

// Search Command
async function search(devHintsService : DevHints) {

      // Display a message box to the user
      const selectedCheat = await vscode.window.showQuickPick(
          devHintsService.getCheatSheets(), 
          { placeHolder: 'Select the cheatsheet to display ...' }
      );

      if (!selectedCheat) {
          vscode.window.showErrorMessage("You must select a valid option");
          return;
      }

      const panel = vscode.window.createWebviewPanel(
        'devhintsPreview', // Identifies the type of the webview. Used internally
        `Documentation for ${selectedCheat}`, // Title of the panel displayed to the user
        vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
        {
            enableScripts: true,
            enableFindWidget: true,
            retainContextWhenHidden: true,
         }
    );

      panel.webview.html = devHintsService.getCheatContent(selectedCheat);
}