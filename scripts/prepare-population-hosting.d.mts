export interface PopulationHostingManifest {
 schemaVersion:number;
 shelves:Record<string,string[]>;
 zipParts:{file:string;bytes:number;sha256:string}[];
 zipBytes:number;
 unattributedPages:Record<string,string>;
}
export function preparePopulationHosting(base:string,options?:{omitOriginals?:boolean}):Promise<PopulationHostingManifest>;
