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
import * as fs from 'fs';
import * as request from 'request';
import * as util from 'util';
import * as mkdirp from 'mkdirp';
import * as tar from 'tar';

async function downloadFile(url: string, dest: string) {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: 'Downloading and installing clangd'
    }, (progress) => {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            request(url).pipe(file);
            file.on('finish', () => { file.close(); resolve() });
        });
    })
}

export async function activate(context: vscode.ExtensionContext) {
    const useBinaries = vscode.workspace.getConfiguration().get('cdt.clangd.binaries.enable');
    if (useBinaries) {
        const clangdDir = path.join(context.extensionPath, 'clangd');
        const clangdExe = path.join(clangdDir, "/bin/clangd" + (process.platform === 'win32' ? ".exe" : ""));
        const installed = await util.promisify(fs.exists)(clangdExe);
        if (!installed) {
            const doit = await vscode.window.showInformationMessage('Would you like to download and install clangd', 'yes', 'no');
            if (doit === 'yes') {
                await util.promisify(mkdirp)(clangdDir);
                const clangdURL = vscode.workspace.getConfiguration().get('cdt.clangd.binaries.url') as string;
                const manifestURL = clangdURL + 'manifest.json';
                const manifestFile = path.join(clangdDir, 'manifest.json');
                await downloadFile(manifestURL, manifestFile);
                const manifest = require(manifestFile);
                const tarball = manifest[process.platform];
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: 'Downloading and installing clangd',
                }, async (progress) => {
                    await downloadFile(clangdURL + tarball, path.join(clangdDir, tarball));
                    await tar.x({
                        file: path.join(clangdDir, tarball),
                        cwd: clangdDir
                    });
                });
                vscode.workspace.getConfiguration().update('clangd.path', clangdExe, vscode.ConfigurationTarget.Global);
                await vscode.window.showInformationMessage('Please reload the window to start the new clangd', 'Reload');
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        } else {
            const clangdPath = vscode.workspace.getConfiguration().get('clangd.path');
            if (clangdPath !== clangdExe) {
                vscode.workspace.getConfiguration().update('clangd.path', clangdExe, vscode.ConfigurationTarget.Global);
                await vscode.window.showInformationMessage('Please reload the window to start the new clangd', 'Reload');
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        }
    }
}