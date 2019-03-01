/*********************************************************************
 * Copyright (c) 2019 QNX Software Systems and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import * as vscode from 'vscode';
import * as path from 'path';
import { Executable, ServerOptions, LanguageClientOptions, LanguageClient, RevealOutputChannelOn } from 'vscode-languageclient';

export function startLanguageServer(context: vscode.ExtensionContext) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const config = vscode.workspace.getConfiguration('cdt.clangd');

        // TODO handle more than one workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

        // TODO use path to bundles clangd as default
        let command = config.get('exec', 'clangd');

        const args: string[] = config.get('arguments', []);

        let compileCommandsDir = config.get<string>('compileCommandsDir');
        if (compileCommandsDir) {
            if (!path.isAbsolute(compileCommandsDir)) {
                compileCommandsDir = path.resolve(workspaceFolder, compileCommandsDir);
            }
            args.push('--compile-commands-dir', compileCommandsDir);
        }

        const clangd: Executable = {
            command,
            args,
            options: {
                cwd: workspaceFolder
            }
        };

        const serverOptions: ServerOptions = clangd;

        const clientOptions: LanguageClientOptions = {
            documentSelector: [
                { scheme: 'file', language: 'c' },
                { scheme: 'file', language: 'cpp' },
                { scheme: 'file', language: 'objective-c'},
                { scheme: 'file', language: 'objective-cpp'},
            ],
            revealOutputChannelOn: RevealOutputChannelOn.Never
        };

        context.subscriptions.push(
            new LanguageClient("CDT clangd", serverOptions, clientOptions).start()
        );
    }
}
