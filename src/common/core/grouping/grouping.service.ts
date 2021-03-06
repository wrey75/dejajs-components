/*
 *  @license
 *  Copyright Hôpitaux Universitaires de Genève. All Rights Reserved.
 *
 *  Use of this source code is governed by an Apache-2.0 license that can be
 *  found in the LICENSE file at https://github.com/DSI-HUG/dejajs-components/blob/master/LICENSE
 */

import 'rxjs/add/operator/mergeMap';
import { Observable } from 'rxjs/Observable';
import { IItemTree } from '../item-list/item-tree';
import { SortingService } from '../sorting/sorting.service';
import { IGroupInfo } from './group-infos';

/** Service de regroupement d'un tableau de modèles */
export class GroupingService {
    /** Groupe les éléments de la liste hierarchique spécifiée à partir du niveau spécifié, et en fonction du modèle de groupe spécifié
     * @param {any[]} tree Liste à trier.
     * @param {IGroupInfo} groupInfos Modèle de groupe à appliquer.
     * @param {string} childrenField Champs à utiliser comme collection des enfants d'un parent.
     * @param {number} depth Niveau à partir duquel le modèle de regroupement doit être appliqué.
     * @return {Observable} Observable résolu par la fonction.
     */
    public group$(tree: any[], groupInfos: IGroupInfo[] | IGroupInfo, childrenField = 'items'): Observable<any[]> {
        if (!tree || tree.length === 0 || !groupInfos) {
            return Observable.of(tree);
        }

        if (groupInfos instanceof Array) {
            // Create a observable stream with a sequence for each groupinfos.
            let result$ = Observable.of(tree);
            groupInfos.forEach((groupInfo) => result$ = result$.switchMap((t) => this.group$(t, groupInfo, childrenField)));
            return result$;
        } else {
            // Group the tree with the current groupInfo
            const groupInfo = groupInfos as IGroupInfo;
            if (!tree[0][childrenField]) {
                // No children, group the tree
                return this.groupChildren$(tree, groupInfo, 0, childrenField);
            }

            const groupTree$ = (t: any[], curDepth: number) => {
                return Observable.from(t)
                    .flatMap((treeItem) => {
                        const children = treeItem[childrenField];
                        if (children[0] && children[0][childrenField]) {
                            return groupTree$(children, curDepth + 1).map(() => treeItem);
                        } else {
                            return this.groupChildren$(children, groupInfo, curDepth, childrenField).map((groupedChildren) => {
                                treeItem[childrenField] = groupedChildren;
                                return treeItem;
                            });
                        }
                    })
                    .reduce((acc: any[], cur) => {
                        // Return the array
                        acc.push(cur);
                        return acc;
                    }, []);
            };

            // If the tree has chidren, group only the last level items
            return groupTree$(tree, 1);
        }
    }

    /**
     * @deprecated
     */
    public group(tree: any[], groupInfos: IGroupInfo[] | IGroupInfo, childrenField?: string) {
        return this.group$(tree, groupInfos, childrenField).toPromise();
    }

    protected groupChildren$(list: any[], groupInfo: IGroupInfo, _depth: number, childrenField: string): Observable<any[]> {
        return Observable.of(list)
            .switchMap((l) => l)
            .reduce((groups: { [groupby: string]: IItemTree }, item) => {
                let groupedBy = typeof groupInfo.groupByField === 'function' ? groupInfo.groupByField(item) : item[groupInfo.groupByField];

                if (typeof groupedBy === 'function') {
                    groupedBy = groupedBy();
                }

                if (!groupedBy) {
                    groupedBy = this.getTextValue(item);
                }

                let parent = groups[groupedBy];

                if (!parent) {
                    const groupLabel = groupInfo.groupTextField ? (typeof groupInfo.groupTextField === 'function' ? groupInfo.groupTextField(item) : item[groupInfo.groupTextField]) : groupedBy;
                    parent = groups[groupedBy] = {
                        depth: _depth,
                        toString: () => groupLabel,
                        $text: groupLabel,
                    } as IItemTree;
                    parent[childrenField] = [];
                }

                parent[childrenField].push(item);
                return groups;
            }, {})
            .map((grps: { [groupby: string]: any }) => Object.keys(grps).map((key) => grps[key]))
            .do((groupedChildren) => groupedChildren.forEach((parent) => parent.sortField = (groupInfo.sortInfos && groupInfo.sortInfos.name) || 'toString'))
            .switchMap((groupedChildren) => {
                if (groupInfo.sortInfos) {
                    const sortingService = new SortingService();
                    return sortingService.sort$(groupedChildren, groupInfo.sortInfos);
                } else {
                    return Observable.of(groupedChildren);
                }
            });
    }

    private getTextValue(value: any) {
        if (!value) {
            return '';
        } else {
            if (value.displayName) {
                return typeof value.displayName === 'string' ? value.displayName : value.displayName();
            } else if (typeof value.toString === 'function') {
                return value.toString();
            }
        }
    }
}
