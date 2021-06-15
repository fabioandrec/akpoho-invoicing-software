import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import FileProvider from 'App/Models/FileProvider'

type FormatAttributes = {
  name: string
  hash: string
  ext: string
  mime: string
  width: number
  height: number
  size: number
  path: string | null
  url: string
}

export type FileFormats = {
  thumbnail: FormatAttributes
  large: FormatAttributes
  medium: FormatAttributes
  small: FormatAttributes
}

export default class UploadedFile extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public companyId: string

  @column()
  public name: string

  @column()
  public alternativeText: string

  @column()
  public caption: string

  @column()
  public width: number

  @column()
  public height: number

  @column()
  public formats: FileFormats | string | null

  @column()
  public hash: string

  @column()
  public ext: string

  @column()
  public mime: string

  @column()
  public url: string

  @column()
  public previewUrl: string

  @column()
  public size: number

  @column()
  public fileProviderId: number

  @column()
  public fileProviderMetadata: unknown

  @column()
  public createdBy: string

  @column()
  public updatedBy: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => FileProvider)
  public provider: BelongsTo<typeof FileProvider>
}
