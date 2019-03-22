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
import * as lang from 'vscode-languageclient';
import * as path from 'path';
import { TypeHierarchyProvider } from './typeHierarcyProvider';

export class ClangdLanguageClient {
    private client?: lang.LanguageClient;

    constructor(context: vscode.ExtensionContext) {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const config = vscode.workspace.getConfiguration('cdt.clangd');

            // TODO handle more than one workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

            // TODO use path to bundles clangd as default
            let command = config.get('exec', 'clangd');

            const args: string[] = config.get('arguments', []);

            // optionally enable the background index
            if (config.get("backgroundIndex")) {
                args.push('--background-index');
            }

            // set location of compile_commands.json file if user gives one
            let compileCommandsDir = config.get<string>('compileCommandsDir');
            if (compileCommandsDir) {
                if (!path.isAbsolute(compileCommandsDir)) {
                    compileCommandsDir = path.resolve(workspaceFolder, compileCommandsDir);
                }
                args.push('--compile-commands-dir', compileCommandsDir);
            }

            const clangd: lang.Executable = {
                command,
                args,
                options: {
                    cwd: workspaceFolder
                }
            };

            const serverOptions: lang.ServerOptions = clangd;

            const clientOptions: lang.LanguageClientOptions = {
                // clangd supports C/C++ and Objective-C/C++
                documentSelector: [
                    { scheme: 'file', language: 'c' },
                    { scheme: 'file', language: 'cpp' },
                    { scheme: 'file', language: 'objective-c'},
                    { scheme: 'file', language: 'objective-cpp'},
                ],
                // Keep the output from popping up by default.
                // It's pretty noisy
                revealOutputChannelOn: lang.RevealOutputChannelOn.Never
            };

            // Create the client and start it up
            this.client = new lang.LanguageClient('CDT clangd', serverOptions, clientOptions);
            context.subscriptions.push(
                this.client.start()
            );

            // Add in our custom type hierarchy support until the proposal
            // is accepted and vscode provides it's own UI
            new TypeHierarchyProvider(context, this.client);
        }
    }
}
