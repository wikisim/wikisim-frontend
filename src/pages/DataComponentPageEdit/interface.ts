import { DataComponent, NewDataComponent } from "core/data/interface"


export type UpdatesFnOrValue = (
    Partial<DataComponent | NewDataComponent>
    | ((current: DataComponent | NewDataComponent) => Partial<DataComponent | NewDataComponent>)
)
