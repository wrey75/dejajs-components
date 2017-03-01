/*
 * *
 *  @license
 *  Copyright Hôpitaux Universitaires de Genève All Rights Reserved.
 *
 *  Use of this source code is governed by an Apache-2.0 license that can be
 *  found in the LICENSE file at https://github.com/DSI-HUG/dejajs-components/blob/master/LICENSE
 * /
 *
 */

import { Injectable } from '@angular/core';
import { Http, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

@Injectable()
export class CountriesService {
    private countriesDic = {} as { [code: string]: ICountry };

    constructor(private http: Http) { }

    public getCountyByCode(code: string): Observable<ICountry> {
        return Observable.of(this.countriesDic[code]);
    }

    public getCountries(query?: string, number?: number): Observable<ICountry[]> {
        return new Observable<ICountry[]>((resolve: Subscriber<ICountry[]>) => {
            /* resolve.error('Get Countries Error'); */
            number = number || 1;
            let getNextBunch = () => {
                if (--number < 0) {
                    resolve.complete();
                    return;
                }

                this.http.get('https://raw.githubusercontent.com/DSI-HUG/dejajs-components/dev/src/demo-app/services/countries.json', { responseType: ResponseContentType.Json })
                    .map((response) => {
                        const datas = response.json();
                        const countries = datas.data as ICountry[];
                        countries.forEach((country) => {
                            country.displayName = country.naqme;
                            this.countriesDic[country.code] = country;
                        });

                        if (query) {
                            const sr = new RegExp('^' + query, 'i');
                            const sc = new RegExp('^(?!' + query + ').*(' + query + ')', 'i');
                            const result = countries.filter((z) => sr.test(z.naqme));
                            countries.forEach((z) => {
                                if (sc.test(z.naqme)) {
                                    result.push(z);
                                }
                            });
                            return result;
                        } else {
                            return countries;
                        }
                    })
                    .subscribe((response: ICountry[]) => {
                        resolve.next(response);
                        setTimeout(() => { getNextBunch(); }, 1);
                    });
            };
            getNextBunch();
        });
    }
}

export interface ICountry {
    displayName: string;
    naqme: string;
    code: string;
    equals?: (item: ICountry) => boolean;
}
