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

 // The type hierarchy API, here until it goes upstream

export namespace TypeHierarchyDirection {
    export const Children = 0;
    export const Parents = 1;
    export const Both = 2;
}
type TypeHierarchyDirection = 0 | 1 | 2;

interface TypeHierarchyParams extends lang.TextDocumentPositionParams {
    resolve?: number;
    direction: TypeHierarchyDirection;
}

interface TypeHierarchyItem {
    name: string;
    detail?: string;
    kind: lang.SymbolKind;
    deprecated?: boolean;
    uri: string;
    range: Range;
    selectionRange: Range;
    parents?: TypeHierarchyItem[];
    children?: TypeHierarchyItem[];
    data?: any
}

export namespace TypeHierarchyRequest {
    export const type = new lang.RequestType<TypeHierarchyParams, TypeHierarchyItem | null, void, void>('textDocument/typeHierarchy');
}

interface ResolveTypeHierarchyItemParams {
    item: TypeHierarchyItem;
    resolve: number;
    direction: TypeHierarchyDirection;
}

export namespace ResolveTypeHierarchyRequest {
    export const type = new lang.RequestType<ResolveTypeHierarchyItemParams, TypeHierarchyItem | null, void, void>('typeHierarchy/resolve');
}

// Wrapper for the items for the type hierarchy view
class TypeHierarchyTreeItem extends vscode.TreeItem {
    constructor(item: TypeHierarchyItem) {
        // TODO expanding all at the moment
        super(item.name, vscode.TreeItemCollapsibleState.Expanded);
    }
}

// Our tree provider for the type heirarchy view
export class TypeHierarchyProvider implements vscode.TreeDataProvider<TypeHierarchyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TypeHierarchyItem> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<TypeHierarchyItem | null | undefined> | undefined = this._onDidChangeTreeData.event;

    private currentItem?: TypeHierarchyItem;

    constructor(context: vscode.ExtensionContext, private client: lang.LanguageClient) {
        // register the tree provider
        context.subscriptions.push(
            vscode.window.registerTreeDataProvider('cdt.typeHierarchyView', this)
        )

        // add command to refresh on new item
        context.subscriptions.push(
            vscode.commands.registerTextEditorCommand('cdt.typeHierarchy', editor => this.openTypeHierarchy(editor))
        )
    }

    getTreeItem(element: TypeHierarchyItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return new TypeHierarchyTreeItem(element);
    }

    getChildren(element?: TypeHierarchyItem | undefined): vscode.ProviderResult<TypeHierarchyItem[]> {
        if (element) {
            // TODO handle different directions
            // For now all we have are parents
            if (element.parents) {
                return Promise.resolve(element.parents);
            } else {
                // TODO call to resolve item if we think there are more
                return Promise.resolve([]);
            }
        } else if (this.currentItem) {
            // Root item
            return Promise.resolve([this.currentItem]);
        } else {
            // No items yet
            return Promise.resolve([]);
        }
    }

    private async openTypeHierarchy(editor: vscode.TextEditor) {
        // request the type hierarchy for the current selection
        const item = await this.client.sendRequest(TypeHierarchyRequest.type, {
            ...this.client.code2ProtocolConverter.asTextDocumentPositionParams(editor.document, editor.selection.active),
            // TODO is 5 enough
            resolve: 5,
            // TODO support different directions
            direction: TypeHierarchyDirection.Both
        });
        if (item) {
            this.currentItem = item;
            this._onDidChangeTreeData.fire();
        } else {
            vscode.window.showInformationMessage('No type hierarchy available for selection');
        }
    }
}

