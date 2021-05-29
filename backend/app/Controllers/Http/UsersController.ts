import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import UserValidator from 'App/Validators/UserValidator'

export default class UsersController {
  public async index({ response, requestedCompany, request, bouncer }: HttpContextContract) {
    await bouncer.with('UserPolicy').authorize('list', requestedCompany!)

    const { search, page, descending, perPage, sortBy } = request.qs()
    //console.log(search, page, descending, perPage, sortBy)

    let subquery = Database.from('users')
      .select(
        'users.id',
        'users.email',
        'users.login_status',
        'users.is_account_activated',
        'users.is_email_verified',
        'users.lifetime_login',
        'users.password_change_required',
        'users.last_login_time',
        'users.account_activated_at',
        'users.email_verified_at',
        'users.created_at',
        'users.updated_at',
        'user_profiles.first_name',
        'user_profiles.last_name'
      )
      .leftJoin('company_user', (query) => {
        query.on('company_user.user_id', '=', 'users.id')
      })
      .leftJoin('user_profiles', (query) => {
        query.on('user_profiles.user_id', '=', 'users.id')
      })
      .where({ 'company_user.company_id': requestedCompany?.id })

    if (sortBy) {
      subquery = subquery.orderBy(sortBy, descending === 'true' ? 'desc' : 'asc')
    }

    const users = await subquery.paginate(page ? page : 1, perPage ? perPage : 20)

    return response.ok({ data: users })
  }

  public async show({ response, requestedCompany, requestedUser, bouncer }: HttpContextContract) {
    await bouncer.with('UserPolicy').authorize('view', requestedCompany!, requestedUser!)

    const user = await User.query()
      .preload('role', (roleQuery) => roleQuery.select('name', 'id'))
      .preload('profile', (profileQuery) => {
        profileQuery.preload('userCountry', (countryQuery) => countryQuery.select('id', 'name'))
        profileQuery.preload('userState', (stateQuery) => stateQuery.select('id', 'name'))
        profileQuery.select(
          'first_name',
          'last_name',
          'middle_name',
          'profile_picture',
          'phone_number',
          'address',
          'city',
          'created_at',
          'updated_at',
          'country_id',
          'state_id'
        )
      })
      .where('id', requestedUser?.id!)
      .first()

    return response.ok({ data: user })
  }

  public async update({
    response,
    requestedCompany,
    requestedUser,
    request,
    bouncer,
  }: HttpContextContract) {
    await request.validate(UserValidator)

    await bouncer.with('UserPolicy').authorize('edit', requestedCompany!, requestedUser!)

    const {
      first_name,
      last_name,
      middle_name,
      phone_number,
      address,
      city,
      email,
      role_id,
      state_id,
      country_id,
    } = request.body()

    requestedUser?.merge({ email, roleId: role_id })
    await requestedUser?.save()

    await requestedUser?.load('profile')
    const requestedUserProfile = requestedUser?.profile
    requestedUserProfile?.merge({
      firstName: first_name,
      middleName: middle_name,
      lastName: last_name,
      phoneNumber: phone_number,
      address,
      city,
      stateId: state_id || null,
      countryId: country_id || null,
    })
    await requestedUserProfile?.save()

    return response.created()
  }

  public async destroy({}: HttpContextContract) {}
}
