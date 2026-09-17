import factory

from .models.user import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: "user%d" % n)

    @factory.lazy_attribute
    def email(self):
        return "%s@example.com" % self.username


a = UserFactory(username="qwerty")
print(a)
